import { pricePlan, type PricedPlan, type PricingRule } from "./pricing.js";
import type { SupplierAdapter } from "./suppliers/types.js";

/** Cowry only lists plans that keep at least this much after wholesale and card fees. */
export const MIN_NET_PROFIT_CENTS = 300;
const CACHE_MS = 10 * 60 * 1000;

export interface CountrySummary {
  countryCode: string;
  countryName: string;
  fromCents: number;
  planCount: number;
}

export class CatalogService {
  private cache = new Map<string, { at: number; plans: PricedPlan[] }>();

  constructor(
    private readonly supplier: SupplierAdapter,
    private readonly rule: PricingRule,
    private readonly now: () => number = Date.now,
  ) {}

  private async load(countryCode = ""): Promise<PricedPlan[]> {
    const key = countryCode.toUpperCase();
    const hit = this.cache.get(key);
    if (hit && this.now() - hit.at < CACHE_MS) return hit.plans;
    const plans = (await this.supplier.listPlans(key || undefined))
      .map((p) => pricePlan(p, this.rule))
      .filter((p) => p.netProfitCents >= MIN_NET_PROFIT_CENTS)
      .sort((a, b) => a.retailCents - b.retailCents);
    this.cache.set(key, { at: this.now(), plans });
    return plans;
  }

  async countries(): Promise<CountrySummary[]> {
    const byCountry = new Map<string, CountrySummary>();
    for (const p of await this.load()) {
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

  async plans(countryCode: string): Promise<PricedPlan[]> {
    return this.load(countryCode);
  }

  async findPlan(countryCode: string, supplierPlanCode: string): Promise<PricedPlan | null> {
    return (await this.load(countryCode)).find((p) => p.supplierPlanCode === supplierPlanCode) ?? null;
  }
}
