import { describe, expect, it } from "vitest";
import { cardFeeCents, pricePlan, retailPriceCents } from "../src/pricing.js";
import type { SupplierPlan } from "../src/suppliers/types.js";

const rule = { minProfitCents: 400, minMarkup: 1.25 };

describe("retailPriceCents", () => {
  it("adds the minimum profit and rounds up to .99", () => {
    // Guinea 5GB at $19.32: max(19.32 + 4, 19.32 × 1.25 = 24.15) → $24.99
    expect(retailPriceCents(1932, rule)).toBe(2499);
  });

  it("uses the flat profit when the markup would be smaller", () => {
    // $4.00 wholesale: max(8.00, 5.00) → $8.99
    expect(retailPriceCents(400, rule)).toBe(899);
  });

  it("never prices below the computed minimum", () => {
    for (const w of [1, 99, 100, 1232, 3864, 10000]) {
      const r = retailPriceCents(w, rule);
      expect(r).toBeGreaterThanOrEqual(Math.max(w + 400, Math.ceil(w * 1.25)));
      expect(r % 100).toBe(99);
    }
  });
});

describe("pricePlan", () => {
  it("reports net profit after wholesale and card fees", () => {
    const plan = { wholesaleCents: 1932 } as SupplierPlan;
    const priced = pricePlan(plan, rule);
    expect(priced.retailCents).toBe(2499);
    expect(cardFeeCents(2499)).toBe(102);
    expect(priced.netProfitCents).toBe(2499 - 1932 - 102);
  });
});

describe("sanctions", () => {
  it("never lists embargoed countries", async () => {
    const { CatalogService } = await import("../src/catalog.js");
    const supplier = {
      id: "mock" as const,
      listPlans: async () => [
        { supplierPlanCode: "CU-1", countryCode: "CU", countryName: "Cuba", name: "Cuba 5GB", dataBytes: 5e9, validityDays: 30, wholesaleCents: 500, networks: [] },
        { supplierPlanCode: "GN-1", countryCode: "GN", countryName: "Guinea", name: "Guinea 5GB", dataBytes: 5e9, validityDays: 30, wholesaleCents: 500, networks: [] },
      ],
    };
    const catalog = new CatalogService(supplier as never, { minProfitCents: 400, minMarkup: 1.25 });
    expect((await catalog.countries()).map((c) => c.countryCode)).toEqual(["GN"]);
    expect(await catalog.findPlan("CU", "CU-1")).toBeNull();
  });
});
