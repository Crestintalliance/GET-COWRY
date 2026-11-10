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
    return packages.map(mapPackage);
  }

  async placeOrder({ plan, idempotencyKey }: PlaceOrderInput): Promise<PlaceOrderResult> {
    const price = this.priceByCode.get(plan.supplierPlanCode) ?? plan.wholesaleCents * 100;
    const obj = await this.call<{ orderNo: string }>("/esim/order", {
      transactionId: idempotencyKey,
      packageInfoList: [{ packageCode: plan.supplierPlanCode, count: 1, price }],
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
