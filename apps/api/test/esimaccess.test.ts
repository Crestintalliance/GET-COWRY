import { describe, expect, it, vi } from "vitest";
import { EsimAccessAdapter, mapPackage, signRequest, toCents } from "../src/suppliers/esimaccess.js";
import { SupplierError } from "../src/suppliers/types.js";

const guineaPackage = {
  packageCode: "PKG-GN-5",
  name: "Guinea 5GB 30Days",
  price: 193200,
  volume: 5 * 1024 ** 3,
  duration: 30,
  durationUnit: "DAY",
  location: "GN",
  locationNetworkList: [
    { locationName: "Guinea", locationCode: "GN", operatorList: [{ operatorName: "Orange", networkType: "4G" }] },
  ],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function adapterWith(responses: Array<Response | Error>) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const fetchImpl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init! });
    const next = responses.shift();
    if (!next) throw new Error("No more mock responses");
    if (next instanceof Error) throw next;
    return next;
  });
  const adapter = new EsimAccessAdapter({
    baseUrl: "https://api.test/api/v1/open",
    accessCode: "AC123",
    secretKey: "SECRET",
    fetchImpl: fetchImpl as unknown as typeof fetch,
    now: () => 1700000000000,
    requestId: () => "req-1",
  });
  return { adapter, calls };
}

describe("eSIM Access helpers", () => {
  it("converts 1/10,000 USD to cents", () => {
    expect(toCents(193200)).toBe(1932);
    expect(toCents(18000)).toBe(180);
  });

  it("maps a package to a supplier-neutral plan", () => {
    const plan = mapPackage(guineaPackage);
    expect(plan).toMatchObject({
      supplier: "esimaccess",
      supplierPlanCode: "PKG-GN-5",
      countryCode: "GN",
      countryName: "Guinea",
      validityDays: 30,
      wholesaleCents: 1932,
      networks: [{ operator: "Orange", type: "4G" }],
    });
  });

  it("signs timestamp + requestId + accessCode + body with HMAC-SHA256", () => {
    const sig = signRequest("1", "r", "a", "{}", "k");
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
    expect(sig).not.toBe(signRequest("1", "r", "a", "{}", "other"));
  });
});

describe("EsimAccessAdapter", () => {
  it("lists plans with signed headers", async () => {
    const { adapter, calls } = adapterWith([jsonResponse({ success: true, obj: { packageList: [guineaPackage] } })]);
    const plans = await adapter.listPlans("GN");
    expect(plans).toHaveLength(1);
    expect(calls[0]!.url).toBe("https://api.test/api/v1/open/package/list");
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers["RT-AccessCode"]).toBe("AC123");
    expect(headers["RT-RequestID"]).toBe("req-1");
    expect(headers["RT-Timestamp"]).toBe("1700000000000");
    expect(headers["RT-Signature"]).toBe(
      signRequest("1700000000000", "req-1", "AC123", calls[0]!.init.body as string, "SECRET"),
    );
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ locationCode: "GN", type: "BASE" });
  });

  it("orders and returns the issued eSIM", async () => {
    const { adapter, calls } = adapterWith([
      jsonResponse({ success: true, obj: { packageList: [guineaPackage] } }),
      jsonResponse({ success: true, obj: { orderNo: "B123" } }),
      jsonResponse({ success: true, obj: { esimList: [{ iccid: "8900", ac: "LPA:1$smdp$X", esimTranNo: "T1" }] } }),
    ]);
    const [plan] = await adapter.listPlans("GN");
    const result = await adapter.placeOrder({ plan: plan!, idempotencyKey: "order-1" });
    expect(result).toEqual({
      status: "issued",
      supplierOrderRef: "B123",
      esim: { iccid: "8900", activationCode: "LPA:1$smdp$X", qrCodeUrl: undefined, supplierEsimRef: "T1" },
    });
    expect(JSON.parse(calls[1]!.init.body as string)).toEqual({
      transactionId: "order-1",
      packageInfoList: [{ packageCode: "PKG-GN-5", count: 1, price: 193200 }],
    });
  });

  it("returns pending when the eSIM is not issued yet", async () => {
    const { adapter } = adapterWith([
      jsonResponse({ success: true, obj: { orderNo: "B124" } }),
      jsonResponse({ success: true, obj: { esimList: [] } }),
    ]);
    const result = await adapter.placeOrder({ plan: mapPackage(guineaPackage), idempotencyKey: "order-2" });
    expect(result).toEqual({ status: "pending", supplierOrderRef: "B124" });
  });

  it("raises a SupplierError when the API reports failure", async () => {
    const { adapter } = adapterWith([jsonResponse({ success: false, errorCode: "200007", errorMsg: "Insufficient balance" })]);
    await expect(adapter.placeOrder({ plan: mapPackage(guineaPackage), idempotencyKey: "o3" })).rejects.toBeInstanceOf(
      SupplierError,
    );
  });

  it("marks 5xx and network errors as retryable", async () => {
    const { adapter } = adapterWith([jsonResponse({}, 503)]);
    await expect(adapter.listPlans()).rejects.toMatchObject({ retryable: true });
    const second = adapterWith([new Error("socket hang up")]);
    await expect(second.adapter.listPlans()).rejects.toMatchObject({ code: "NETWORK", retryable: true });
  });
});
