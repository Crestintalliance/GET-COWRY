import { pricePlan, type PricedPlan, type PricingRule } from "./pricing.js";
import { isBlocked } from "./sanctions.js";
import type { SupplierAdapter, SupplierId } from "./suppliers/types.js";

/** Cowry only lists plans that keep at least this much after wholesale and card fees. */
export const MIN_NET_PROFIT_CENTS = 300;
const CACHE_MS = 10 * 60 * 1000;

export interface CountrySummary {
  countryCode: string;
  countryName: string;
  fromCents: number;
  planCount: number;
}

/** A regional plan that gives at least as much data and time as a country plan, for less. */
export interface BetterValue {
  plan: PricedPlan;
  /** The country plan it beats, and by how much. */
  comparedTo: PricedPlan;
  savingsCents: number;
}

const isRegional = (p: PricedPlan) => Boolean(p.region);

export class CatalogService {
  private cache: { at: number; local: PricedPlan[]; regional: PricedPlan[] } | null = null;
  private readonly suppliers: SupplierAdapter[];

  /**
   * @param suppliers The first supplier is the default; others fill countries it doesn't cover.
   * @param routes Country code → supplier to prefer for that country (e.g. GN → esimaccess).
   */
  constructor(
    suppliers: SupplierAdapter | SupplierAdapter[],
    private readonly rule: PricingRule,
    private readonly now: () => number = Date.now,
    private readonly routes: Map<string, SupplierId> = new Map(),
  ) {
    this.suppliers = Array.isArray(suppliers) ? suppliers : [suppliers];
  }

  private async load(): Promise<{ local: PricedPlan[]; regional: PricedPlan[] }> {
    if (this.cache && this.now() - this.cache.at < CACHE_MS) return this.cache;
    const bySupplier = await Promise.all(
      this.suppliers.map(async (s) => {
        try {
          return await s.listPlans();
        } catch (err) {
          // One supplier being down shouldn't empty the store; the others still sell.
          console.error(`[catalog] ${s.id} plans unavailable`, err);
          return [];
        }
      }),
    );
    const priced = bySupplier
      .flat()
      .map((p) => pricePlan(p, this.rule))
      .filter((p) => p.netProfitCents >= MIN_NET_PROFIT_CENTS && !isBlocked(p.countryCode));

    // Each country is sold by one supplier: its route if set and stocked, else the first that has it.
    const order = this.suppliers.map((s) => s.id);
    const localAll = priced.filter((p) => !isRegional(p));
    const byCountry = new Map<string, PricedPlan[]>();
    for (const p of localAll) byCountry.set(p.countryCode, [...(byCountry.get(p.countryCode) ?? []), p]);
    const local: PricedPlan[] = [];
    for (const [cc, plans] of byCountry) {
      const routed = this.routes.get(cc);
      const pick =
        (routed && plans.some((p) => p.supplier === routed) ? routed : undefined) ??
        order.find((id) => plans.some((p) => p.supplier === id));
      local.push(...plans.filter((p) => p.supplier === pick));
    }
    const regional = priced
      .filter(isRegional)
      .map((p) => ({ ...p, region: { ...p.region!, coverage: p.region!.coverage.filter((c) => !isBlocked(c)) } }));

    const sort = (a: PricedPlan, b: PricedPlan) => a.retailCents - b.retailCents;
    this.cache = { at: this.now(), local: local.sort(sort), regional: regional.sort(sort) };
    return this.cache;
  }

  async countries(): Promise<CountrySummary[]> {
    const byCountry = new Map<string, CountrySummary>();
    for (const p of (await this.load()).local) {
      const c = byCountry.get(p.countryCode);
      if (!c) {
        byCountry.set(p.countryCode, {
          countryCode: p.countryCode,
          countryName: p.countryName,
          fromCents: p.retailCents,
          planCount: 1,
        });
      } else {
        c.fromCents = Math.min(c.fromCents, p.retailCents);
        c.planCount += 1;
      }
    }
    return [...byCountry.values()].sort((a, b) => a.countryName.localeCompare(b.countryName));
  }

  /** Country plans for one country. */
  async plans(countryCode: string): Promise<PricedPlan[]> {
    const cc = countryCode.toUpperCase();
    return (await this.load()).local.filter((p) => p.countryCode === cc);
  }

  /** Regional plans that work in every one of these countries, cheapest first. */
  async regionalFor(countryCodes: string[]): Promise<PricedPlan[]> {
    const codes = countryCodes.map((c) => c.toUpperCase());
    if (!codes.length || codes.some(isBlocked)) return [];
    return (await this.load()).regional.filter((p) => codes.every((c) => p.region!.coverage.includes(c)));
  }

  /**
   * The regional plan worth recommending instead of a country plan: same or more data and days,
   * lower price. Picks the biggest saving. Null when no regional plan is genuinely better.
   */
  async betterValue(countryCode: string): Promise<BetterValue | null> {
    const [local, regional] = await Promise.all([this.plans(countryCode), this.regionalFor([countryCode])]);
    let best: BetterValue | null = null;
    for (const r of regional) {
      for (const l of local) {
        if (r.dataBytes < l.dataBytes || r.validityDays < l.validityDays || r.retailCents >= l.retailCents) continue;
        const savingsCents = l.retailCents - r.retailCents;
        if (!best || savingsCents > best.savingsCents || (savingsCents === best.savingsCents && r.retailCents < best.plan.retailCents)) {
          best = { plan: r, comparedTo: l, savingsCents };
        }
      }
    }
    return best;
  }

  /** A country plan, or a regional plan that covers the country. */
  async findPlan(countryCode: string, supplierPlanCode: string): Promise<PricedPlan | null> {
    const own = (await this.plans(countryCode)).find((p) => p.supplierPlanCode === supplierPlanCode);
    if (own) return own;
    return (await this.regionalFor([countryCode])).find((p) => p.supplierPlanCode === supplierPlanCode) ?? null;
  }
}
