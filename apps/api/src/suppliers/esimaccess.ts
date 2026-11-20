import { createHmac, randomUUID } from "node:crypto";
import {
  type IssuedEsim,
  type PlaceOrderInput,
  type PlaceOrderResult,
  type SupplierAdapter,
  type SupplierPlan,
  SupplierError,
} from "./types.js";

/**
 * eSIM Access (https://esimaccess.com) adapter.
 *
 * API facts used here (verify against the eSIM Access developer docs during sandbox testing):
 * - Base URL: https://api.esimaccess.com/api/v1/open, all calls are POST with a JSON body.
 * - Prices are integers in 1/10,000 USD (18000 = $1.80). Data volumes are in bytes.
 * - Responses look like { success, errorCode, errorMsg, obj }.
 * - Ordering returns an orderNo; the eSIM details arrive via /esim/query a few seconds later.
 */

type Fetch = typeof fetch;

export interface EsimAccessOptions {
  baseUrl: string;
  accessCode: string;
  /** Signing key. Falls back to the access code if eSIM Access does not issue a separate secret. */
  secretKey?: string;
  fetchImpl?: Fetch;
  now?: () => number;
  requestId?: () => string;
}

interface ApiResponse<T> {
  success: boolean;
  errorCode?: string | null;
  errorMsg?: string | null;
  obj?: T;
}

interface ApiOperator {
  operatorName?: string;
  networkType?: string;
}
interface ApiLocationNetwork {
  locationName?: string;
  locationCode?: string;
  operatorList?: ApiOperator[];
}
export interface ApiPackage {
  packageCode: string;
  name: string;
  price: number;
  volume: number;
  duration: number;
  durationUnit?: string;
  location?: string;
  /** 1 = data in total, 2 = daily (a set amount of fast data per day, then slowed). */
  dataType?: number;
  /** Speed after the daily fast data is used, e.g. "512 Kbps" or "1 Mbps". */
  fupPolicy?: string;
  locationNetworkList?: ApiLocationNetwork[];
}
interface ApiEsim {
  iccid?: string;
  ac?: string;
  qrCodeUrl?: string;
  esimTranNo?: string;
}

/** HMAC-SHA256 over timestamp + requestId + accessCode + body, hex-encoded. */
export function signRequest(
  timestamp: string,
  requestId: string,
  accessCode: string,
  body: string,
  key: string,
): string {
  return createHmac("sha256", key).update(timestamp + requestId + accessCode + body).digest("hex");
}

/** eSIM Access price units (1/10,000 USD) to US cents. */
export function toCents(apiPrice: number): number {
  return Math.round(apiPrice / 100);
}

function toDays(duration: number, unit?: string): number {
  return unit && unit.toUpperCase().startsWith("MONTH") ? duration * 30 : duration;
}

/** "512 Kbps" → 512, "1 Mbps" → 1000. */
export function parseKbps(s?: string): number | undefined {
  const m = s?.match(/([\d.]+)\s*(k|m)bps/i);
  if (!m) return undefined;
  return Math.round(Number(m[1]) * (m[2]!.toLowerCase() === "m" ? 1000 : 1));
}

/** How many days we sell a daily plan for. eSIM Access prices daily plans per day. */
export const DAILY_BUNDLES = [7, 14, 30];
const DAILY_SEP = "@";

export const isDaily = (p: ApiPackage) => p.dataType === 2 || /\/day/i.test(p.name);

/** A daily plan becomes one plan per bundle length, e.g. "GN_1_Daily@14". */
export function mapDaily(p: ApiPackage): SupplierPlan[] {
  const base = mapPackage(p);
  return DAILY_BUNDLES.map((days) => ({
    ...base,
    supplierPlanCode: `${p.packageCode}${DAILY_SEP}${days}`,
    name: `${base.countryName} daily unlimited, ${days} days`,
    dataBytes: 0,
    validityDays: days,
    wholesaleCents: toCents(p.price) * days,
    unlimited: { highSpeedBytesPerDay: p.volume, slowKbps: parseKbps(p.fupPolicy) ?? 512 },
    periodDays: days,
  }));
}

export function splitDailyCode(code: string): { packageCode: string; days?: number } {
  const [packageCode, days] = code.split(DAILY_SEP);
  return days ? { packageCode: packageCode!, days: Number(days) } : { packageCode: code };
}

export function mapPackage(p: ApiPackage): SupplierPlan {
  const loc = p.locationNetworkList?.[0];
  const countryCode = (loc?.locationCode ?? p.location ?? "").split(",")[0]!.trim().toUpperCase();
  const networks = (p.locationNetworkList ?? []).flatMap((l) =>
    (l.operatorList ?? []).map((o) => ({
      operator: o.operatorName ?? "Unknown",
      type: o.networkType ?? "",
    })),
  );
  return {
    supplier: "esimaccess",
    supplierPlanCode: p.packageCode,
    countryCode,
    countryName: loc?.locationName ?? countryCode,
    name: p.name,
    dataBytes: p.volume,
    validityDays: toDays(p.duration, p.durationUnit),
    wholesaleCents: toCents(p.price),
    networks,
  };
}

export class EsimAccessAdapter implements SupplierAdapter {
  readonly id = "esimaccess" as const;
  private readonly fetchImpl: Fetch;
  private readonly now: () => number;
  private readonly requestId: () => string;
  /** Last list prices seen, by package code, so orders send the expected price. */
  private readonly priceByCode = new Map<string, number>();

  constructor(private readonly opts: EsimAccessOptions) {
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.now = opts.now ?? Date.now;
    this.requestId = opts.requestId ?? randomUUID;
  }

  private async call<T>(path: string, payload: unknown): Promise<T> {
    const body = JSON.stringify(payload);
    const timestamp = String(this.now());
    const requestId = this.requestId();
    const signature = signRequest(
      timestamp,
      requestId,
      this.opts.accessCode,
      body,
      this.opts.secretKey ?? this.opts.accessCode,
    );
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.opts.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "RT-AccessCode": this.opts.accessCode,
          "RT-RequestID": requestId,
          "RT-Timestamp": timestamp,
          "RT-Signature": signature,
        },
        body,
      });
    } catch (err) {
      throw new SupplierError(`Network error calling eSIM Access ${path}`, "esimaccess", "NETWORK", true);
    }
    if (!res.ok) {
      throw new SupplierError(
        `eSIM Access ${path} returned HTTP ${res.status}`,
        "esimaccess",
        `HTTP_${res.status}`,
        res.status >= 500,
      );
    }
    const json = (await res.json()) as ApiResponse<T>;
    if (!json.success || json.obj === undefined) {
      throw new SupplierError(
        `eSIM Access ${path} failed: ${json.errorMsg ?? "unknown error"}`,
        "esimaccess",
        json.errorCode ?? undefined,
      );
    }
    return json.obj;
  }

  async listPlans(countryCode?: string): Promise<SupplierPlan[]> {
    const obj = await this.call<{ packageList?: ApiPackage[] }>("/package/list", {
      locationCode: countryCode ?? "",
      type: "BASE",
    });
    const packages = obj.packageList ?? [];
    for (const p of packages) this.priceByCode.set(p.packageCode, p.price);
    return packages.flatMap((p) => (isDaily(p) ? mapDaily(p) : [mapPackage(p)]));
  }

  async placeOrder({ plan, idempotencyKey }: PlaceOrderInput): Promise<PlaceOrderResult> {
    const { packageCode, days } = splitDailyCode(plan.supplierPlanCode);
    // Daily plans: unit price per day, with periodNum days. Check this against the sandbox.
    const price = this.priceByCode.get(packageCode) ?? Math.round((plan.wholesaleCents * 100) / (days ?? 1));
    const obj = await this.call<{ orderNo: string }>("/esim/order", {
      transactionId: idempotencyKey,
      ...(days ? { amount: price * days } : {}),
      packageInfoList: [{ packageCode, count: 1, price, ...(days ? { periodNum: days } : {}) }],
    });
    const esim = await this.getOrderEsim(obj.orderNo).catch(() => null);
    return esim
      ? { status: "issued", supplierOrderRef: obj.orderNo, esim }
      : { status: "pending", supplierOrderRef: obj.orderNo };
  }

  async getOrderEsim(supplierOrderRef: string): Promise<IssuedEsim | null> {
    const obj = await this.call<{ esimList?: ApiEsim[] }>("/esim/query", {
      orderNo: supplierOrderRef,
      pager: { pageNum: 1, pageSize: 20 },
    });
    const e = obj.esimList?.[0];
    if (!e?.iccid || !e.ac) return null;
    return { iccid: e.iccid, activationCode: e.ac, qrCodeUrl: e.qrCodeUrl, supplierEsimRef: e.esimTranNo };
  }
}
