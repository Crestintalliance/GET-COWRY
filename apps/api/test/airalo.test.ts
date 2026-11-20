import { describe, expect, it, vi } from "vitest";
import { CatalogService } from "../src/catalog.js";
import { AiraloAdapter, mapItems, toEsim, type ApiItem } from "../src/suppliers/airalo.js";
import type { SupplierAdapter, SupplierPlan } from "../src/suppliers/types.js";

// Shaped like Airalo's GET /v2/packages response; prices are made up for the test.
const ITEMS: ApiItem[] = [
  {
    slug: "panama",
    country_code: "PA",
    title: "Panama",
    operators: [
      {
        type: "local",
        coverages: [{ name: "PA", networks: [{ name: "Tigo", type: "4G" }] }],
        packages: [
          { id: "pa-5gb-30", type: "sim", amount: 5120, day: 30, prices: { net_price: { USD: 20 }, recommended_retail_price: { USD: 30 } } },
          { id: "pa-unl-7", type: "sim", amount: 0, day: 7, is_unlimited: true, prices: { net_price: { USD: 20 }, recommended_retail_price: { USD: 40 } } },
          { id: "pa-topup", type: "topup", amount: 1024, day: 7, prices: { net_price: { USD: 3 }, recommended_retail_price: { USD: 6 } } },
        ],
      },
    ],
  },
  {
    slug: "latin-america",
    country_code: "",
    title: "Latin America",
    operators: [
      {
        type: "global",
        coverages: [{ name: "PA" }, { name: "CO" }, { name: "CU" }],
        packages: [
          { id: "latam-5gb-30", type: "sim", amount: 5120, day: 30, prices: { net_price: { USD: 8 }, recommended_retail_price: { USD: 22 } } },
        ],
      },
    ],
  },
];

describe("Airalo mapping", () => {
  it("maps country, unlimited and regional plans with recommended prices, skipping top-ups", () => {
    const plans = mapItems(ITEMS);
    expect(plans.map((p) => p.supplierPlanCode)).toEqual(["pa-5gb-30", "pa-unl-7", "latam-5gb-30"]);
    expect(plans[1]).toMatchObject({ dataBytes: 0, validityDays: 7, unlimited: {} });
    expect(plans[0]).toMatchObject({ countryCode: "PA", wholesaleCents: 2000, recommendedRetailCents: 3000, dataBytes: 5 * 1024 ** 3 });
    expect(plans[0]!.networks).toEqual([{ operator: "Tigo", type: "4G" }]);
    expect(plans[2]!.region).toEqual({ name: "Latin America", coverage: ["PA", "CO", "CU"] });
  });

  it("builds the LPA activation code", () => {
    expect(toEsim({ iccid: "89", lpa: "lpa.airalo.com", matching_id: "ABC" })!.activationCode).toBe("LPA:1$lpa.airalo.com$ABC");
    expect(toEsim({ iccid: "89", qrcode: "LPA:1$x$Y" })!.activationCode).toBe("LPA:1$x$Y");
    expect(toEsim({ iccid: "89" })).toBeNull();
  });
});

describe("AiraloAdapter", () => {
  it("logs in once, lists packages and places orders", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = String(url);
      if (u.endsWith("/token")) return Response.json({ data: { access_token: "tok", expires_in: 86400 } });
      if (u.includes("/packages")) return Response.json({ data: ITEMS, meta: { last_page: 1 } });
      if (u.endsWith("/orders")) return Response.json({ data: { id: 77, sims: [{ iccid: "8901", lpa: "lpa.airalo.com", matching_id: "M1" }] } });
      return new Response("not found", { status: 404 });
    });
    const a = new AiraloAdapter({ baseUrl: "https://api.test/v2", clientId: "id", clientSecret: "secret", fetchImpl: fetchImpl as unknown as typeof fetch });
    expect((await a.listPlans("CO")).map((p) => p.supplierPlanCode)).toEqual(["latam-5gb-30"]);
    await a.listPlans();
    const plan = (await a.listPlans("PA"))[0]!;
    const result = await a.placeOrder({ plan, idempotencyKey: "order-1" });
    expect(result).toEqual({ status: "issued", supplierOrderRef: "77", esim: { iccid: "8901", activationCode: "LPA:1$lpa.airalo.com$M1", qrCodeUrl: undefined, supplierEsimRef: "8901" } });
    const calls = fetchImpl.mock.calls.map((c) => String(c[0]));
    expect(calls.filter((c) => c.endsWith("/token"))).toHaveLength(1);
    expect(calls.filter((c) => c.includes("/packages"))).toHaveLength(1);
  });
});

describe("catalog with Airalo", () => {
  const rule = { minProfitCents: 400, minMarkup: 1.25 };
  const airalo: SupplierAdapter = {
    id: "airalo",
    listPlans: async () => mapItems(ITEMS),
    placeOrder: async () => ({ status: "pending", supplierOrderRef: "x" }),
    getOrderEsim: async () => null,
  };
  const gn = (code: string, cents: number): SupplierPlan => ({
    supplier: "esimaccess", supplierPlanCode: code, countryCode: "GN", countryName: "Guinea", name: code,
    dataBytes: 5 * 1024 ** 3, validityDays: 30, wholesaleCents: cents, networks: [],
  });
  const esimaccess: SupplierAdapter = {
    id: "esimaccess",
    listPlans: async () => [gn("GN-5", 1932), { ...gn("PA-ea", 900), countryCode: "PA", countryName: "Panama" }],
    placeOrder: async () => ({ status: "pending", supplierOrderRef: "y" }),
    getOrderEsim: async () => null,
  };

  it("sells at Airalo's recommended price and routes countries to the chosen supplier", async () => {
    const catalog = new CatalogService([airalo, esimaccess], rule, Date.now, new Map([["GN", "esimaccess" as const]]));
    const pa = await catalog.plans("PA");
    expect(pa.map((p) => [p.supplier, p.retailCents])).toEqual([["airalo", 3000], ["airalo", 4000]]);
    expect((await catalog.plans("GN"))[0]!.supplier).toBe("esimaccess");
    expect((await catalog.countries()).map((c) => c.countryCode).sort()).toEqual(["GN", "PA"]);
  });

  it("recommends the regional plan when it is better value, and never shows embargoed coverage", async () => {
    const catalog = new CatalogService([airalo], rule);
    const better = await catalog.betterValue("PA");
    expect(better).toMatchObject({ savingsCents: 800 });
    expect(better!.plan.supplierPlanCode).toBe("latam-5gb-30");
    expect(better!.plan.region!.coverage).toEqual(["PA", "CO"]);
    expect((await catalog.regionalFor(["PA", "CO"])).map((p) => p.supplierPlanCode)).toEqual(["latam-5gb-30"]);
    expect(await catalog.findPlan("PA", "latam-5gb-30")).not.toBeNull();
    expect(await catalog.betterValue("CO")).toBeNull();
  });
});
