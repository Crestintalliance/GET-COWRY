import {
  type IssuedEsim,
  type PlaceOrderInput,
  type PlaceOrderResult,
  type SupplierAdapter,
  type SupplierPlan,
  SupplierError,
} from "./types.js";

/**
 * Airalo Partner API v2 adapter (https://developers.partners.airalo.com).
 *
 * API facts used here; check them in Sandbox mode before going live:
 * - POST {base}/token with client_id, client_secret, grant_type=client_credentials returns
 *   data.access_token, valid 24 hours. Token requests are rate-limited, so the token is cached.
 * - GET {base}/packages?limit=1000&page=N lists every country ("local") and region ("global").
 *   Each item has operators[]; each operator has packages[] and coverages[] (country codes).
 *   Prices sit in package.prices.net_price.USD and package.prices.recommended_retail_price.USD.
 *   Airalo asks partners to sync at least hourly; we cache for 30 minutes.
 * - POST {base}/orders (form fields quantity, package_id, type=sim, description) returns
 *   data.id and data.sims[] with iccid, lpa, matching_id, qrcode, qrcode_url.
 * - GET {base}/orders/{id}?include=sims returns the same order later.
 *
 * Net prices are Airalo's confidential information: they are only held in memory here.
 */

type Fetch = typeof fetch;

export interface AiraloOptions {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  fetchImpl?: Fetch;
  now?: () => number;
  cacheMs?: number;
}

interface Money {
  USD?: number;
}
export interface ApiPackage {
  id: string;
  type: string;
  amount?: number;
  day?: number;
  is_unlimited?: boolean;
  title?: string;
  data?: string;
  net_price?: number;
  prices?: { net_price?: Money; recommended_retail_price?: Money };
}
interface ApiNetwork {
  name?: string;
  type?: string;
}
export interface ApiOperator {
  id?: number;
  title?: string;
  type?: string;
  coverages?: { name?: string; code?: string; networks?: ApiNetwork[] }[];
  countries?: { country_code?: string; title?: string }[];
  packages?: ApiPackage[];
}
export interface ApiItem {
  slug: string;
  country_code?: string;
  title?: string;
  operators?: ApiOperator[];
}
interface ApiSim {
  iccid?: string;
  lpa?: string;
  matching_id?: string;
  qrcode?: string;
  qrcode_url?: string;
}

const MB = 1024 ** 2;

/** Dollars (as Airalo returns them) to cents. */
const cents = (usd: number | undefined) => (usd === undefined ? undefined : Math.round(usd * 100));

/** Pseudo country code for a region, so regional plans group under their own key. */
export const regionKey = (slug: string) => `R:${slug}`;

function coverageOf(op: ApiOperator): string[] {
  const fromCoverages = (op.coverages ?? []).map((c) => (c.code ?? c.name ?? "").toUpperCase());
  const fromCountries = (op.countries ?? []).map((c) => (c.country_code ?? "").toUpperCase());
  return [...new Set([...fromCoverages, ...fromCountries].filter((c) => /^[A-Z]{2}$/.test(c)))];
}

/** Turn Airalo's nested package list into flat plans. Top-ups are left out. */
export function mapItems(items: ApiItem[]): SupplierPlan[] {
  const plans: SupplierPlan[] = [];
  for (const item of items) {
    const cc = (item.country_code ?? "").toUpperCase();
    for (const op of item.operators ?? []) {
      const regional = op.type === "global" || !/^[A-Z]{2}$/.test(cc);
      const coverage = coverageOf(op);
      const networks = (op.coverages ?? []).flatMap((c) =>
        regional ? [] : (c.networks ?? []).map((n) => ({ operator: n.name ?? "Unknown", type: n.type ?? "" })),
      );
      for (const p of op.packages ?? []) {
        const unlimited = Boolean(p.is_unlimited);
        if (p.type !== "sim" || !p.day || (!unlimited && !p.amount)) continue;
        const wholesale = cents(p.prices?.net_price?.USD ?? p.net_price);
        if (wholesale === undefined) continue;
        plans.push({
          supplier: "airalo",
          supplierPlanCode: p.id,
          countryCode: regional ? regionKey(item.slug) : cc,
          countryName: item.title ?? cc,
          name: p.title ?? p.id,
          dataBytes: unlimited ? 0 : p.amount! * MB,
          validityDays: p.day,
          wholesaleCents: wholesale,
          recommendedRetailCents: cents(p.prices?.recommended_retail_price?.USD),
          networks: regional ? [{ operator: `${coverage.length} countries`, type: "" }] : networks,
          ...(regional ? { region: { name: item.title ?? item.slug, coverage } } : {}),
          ...(unlimited ? { unlimited: {} } : {}),
        });
      }
    }
  }
  return plans;
}

/** Airalo returns the LPA parts separately; build the full activation string. */
export function toEsim(sim: ApiSim): IssuedEsim | null {
  if (!sim.iccid) return null;
  const activationCode = sim.qrcode?.startsWith("LPA:")
    ? sim.qrcode
    : sim.lpa && sim.matching_id
      ? `LPA:1$${sim.lpa}$${sim.matching_id}`
      : null;
  if (!activationCode) return null;
  return { iccid: sim.iccid, activationCode, qrCodeUrl: sim.qrcode_url, supplierEsimRef: sim.iccid };
}

export class AiraloAdapter implements SupplierAdapter {
  readonly id = "airalo" as const;
  private readonly fetchImpl: Fetch;
  private readonly now: () => number;
  private readonly cacheMs: number;
  private token: { value: string; expiresAt: number } | null = null;
  private catalog: { at: number; plans: SupplierPlan[] } | null = null;

  constructor(private readonly opts: AiraloOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.now = opts.now ?? Date.now;
    this.cacheMs = opts.cacheMs ?? 30 * 60 * 1000;
  }

  private async accessToken(): Promise<string> {
    if (this.token && this.now() < this.token.expiresAt) return this.token.value;
    const form = new FormData();
    form.set("client_id", this.opts.clientId);
    form.set("client_secret", this.opts.clientSecret);
    form.set("grant_type", "client_credentials");
    const json = await this.send<{ data?: { access_token?: string; expires_in?: number } }>("/token", {
      method: "POST",
      body: form,
    }, false);
    const value = json.data?.access_token;
    if (!value) throw new SupplierError("Airalo did not return an access token", "airalo", "NO_TOKEN");
    // Renew an hour early so a long request never runs on an expired token.
    const lifetimeMs = (json.data?.expires_in ?? 86_400) * 1000;
    this.token = { value, expiresAt: this.now() + Math.max(lifetimeMs - 3_600_000, 60_000) };
    return value;
  }

  private async send<T>(path: string, init: RequestInit, auth = true): Promise<T> {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (auth) headers.Authorization = `Bearer ${await this.accessToken()}`;
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.opts.baseUrl}${path}`, { ...init, headers });
    } catch {
      throw new SupplierError(`Network error calling Airalo ${path}`, "airalo", "NETWORK", true);
    }
    if (res.status === 401 && auth) this.token = null;
    if (!res.ok) {
      throw new SupplierError(`Airalo ${path} returned HTTP ${res.status}`, "airalo", `HTTP_${res.status}`, res.status >= 500 || res.status === 429);
    }
    return (await res.json()) as T;
  }

  private async all(): Promise<SupplierPlan[]> {
    if (this.catalog && this.now() - this.catalog.at < this.cacheMs) return this.catalog.plans;
    const items: ApiItem[] = [];
    for (let page = 1; page <= 20; page++) {
      const json = await this.send<{ data?: ApiItem[]; meta?: { last_page?: number } }>(
        `/packages?limit=1000&page=${page}`,
        { method: "GET" },
      );
      items.push(...(json.data ?? []));
      if (!json.meta?.last_page || page >= json.meta.last_page) break;
    }
    const plans = mapItems(items);
    this.catalog = { at: this.now(), plans };
    return plans;
  }

  async listPlans(countryCode?: string): Promise<SupplierPlan[]> {
    const plans = await this.all();
    if (!countryCode) return plans;
    const cc = countryCode.toUpperCase();
    return plans.filter((p) => p.countryCode === cc || p.region?.coverage.includes(cc));
  }

  async placeOrder({ plan, idempotencyKey }: PlaceOrderInput): Promise<PlaceOrderResult> {
    const form = new FormData();
    form.set("quantity", "1");
    form.set("package_id", plan.supplierPlanCode);
    form.set("type", "sim");
    // Airalo has no idempotency key; our order id goes in the description so duplicates can be traced.
    form.set("description", `joincowry ${idempotencyKey}`);
    const json = await this.send<{ data?: { id?: number | string; sims?: ApiSim[] } }>("/orders", { method: "POST", body: form });
    const ref = String(json.data?.id ?? "");
    if (!ref) throw new SupplierError("Airalo did not return an order id", "airalo", "NO_ORDER");
    const esim = json.data?.sims?.[0] ? toEsim(json.data.sims[0]) : null;
    return esim ? { status: "issued", supplierOrderRef: ref, esim } : { status: "pending", supplierOrderRef: ref };
  }

  async getOrderEsim(supplierOrderRef: string): Promise<IssuedEsim | null> {
    const json = await this.send<{ data?: { sims?: ApiSim[] } }>(
      `/orders/${encodeURIComponent(supplierOrderRef)}?include=sims`,
      { method: "GET" },
    );
    const sim = json.data?.sims?.[0];
    return sim ? toEsim(sim) : null;
  }
}
