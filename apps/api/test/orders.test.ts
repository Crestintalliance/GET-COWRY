import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { CatalogService } from "../src/catalog.js";
import type { Notifier } from "../src/notify.js";
import { MemoryOrderRepository } from "../src/orders/memoryRepo.js";
import { OrderService } from "../src/orders/service.js";
import { DevPayments } from "../src/payments.js";
import { MockSupplier } from "../src/suppliers/mock.js";
import type { SupplierAdapter, SupplierId } from "../src/suppliers/types.js";

function setup(supplier: SupplierAdapter = new MockSupplier()) {
  const repo = new MemoryOrderRepository();
  const catalog = new CatalogService(supplier, { minProfitCents: 400, minMarkup: 1.25 });
  const notifier: Notifier = { esimReady: vi.fn(async () => {}), fulfillmentFailed: vi.fn(async () => {}) };
  const payments = new DevPayments("http://web.test");
  const suppliers = new Map<SupplierId, SupplierAdapter>([[supplier.id, supplier]]);
  const orders = new OrderService(repo, catalog, suppliers, payments, notifier, "http://web.test");
  const app = createApp({ catalog, orders, payments, devPayments: true });
  return { app, repo, notifier, supplier };
}

async function checkout(app: ReturnType<typeof setup>["app"]) {
  const res = await request(app)
    .post("/api/checkout")
    .send({ countryCode: "gn", planCode: "GN-5GB-30D", email: "awa@example.com", locale: "fr" });
  expect(res.status).toBe(201);
  return res.body as { orderId: string; token: string; checkoutUrl: string };
}

describe("catalog routes", () => {
  it("lists countries with a starting price", async () => {
    const { app } = setup();
    const res = await request(app).get("/api/countries");
    const guinea = res.body.countries.find((c: { countryCode: string }) => c.countryCode === "GN");
    expect(guinea).toMatchObject({ countryName: "Guinea", fromCents: 1699, planCount: 3 });
  });

  it("lists plans for a country, cheapest first", async () => {
    const { app } = setup();
    const res = await request(app).get("/api/countries/gn/plans");
    expect(res.body.plans.map((p: { priceCents: number }) => p.priceCents)).toEqual([1699, 2499, 4899]);
    expect(res.body.plans[0]).not.toHaveProperty("wholesaleCents");
  });

  it("rejects a bad country code", async () => {
    const { app } = setup();
    expect((await request(app).get("/api/countries/guinea/plans")).status).toBe(400);
  });
});

describe("checkout and fulfillment", () => {
  it("creates an unpaid order and does not reveal the eSIM", async () => {
    const { app } = setup();
    const { orderId, token, checkoutUrl } = await checkout(app);
    expect(checkoutUrl).toContain(orderId);
    const view = await request(app).get(`/api/orders/${orderId}`).query({ token });
    expect(view.body).toMatchObject({ status: "awaiting_payment", retailCents: 2499, esim: null });
  });

  it("refuses to show an order without the right token", async () => {
    const { app } = setup();
    const { orderId } = await checkout(app);
    expect((await request(app).get(`/api/orders/${orderId}`).query({ token: "wrong" })).status).toBe(404);
  });

  it("issues the eSIM once payment is confirmed", async () => {
    const { app, notifier } = setup();
    const { orderId, token } = await checkout(app);
    const paid = await request(app).post(`/api/dev/orders/${orderId}/pay`);
    expect(paid.body.status).toBe("fulfilled");
    const view = await request(app).get(`/api/orders/${orderId}`).query({ token });
    expect(view.body.esim.activationCode).toMatch(/^LPA:1\$/);
    expect(notifier.esimReady).toHaveBeenCalledTimes(1);
  });

  it("orders only one eSIM when the payment webhook arrives twice", async () => {
    const supplier = new MockSupplier();
    const spy = vi.spyOn(supplier, "placeOrder");
    const { app } = setup(supplier);
    const { orderId } = await checkout(app);
    await Promise.all([
      request(app).post(`/api/dev/orders/${orderId}/pay`),
      request(app).post(`/api/dev/orders/${orderId}/pay`),
    ]);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("finishes a pending order on the next status check", async () => {
    const { app } = setup(new MockSupplier({ issueImmediately: false }));
    const { orderId, token } = await checkout(app);
    const paid = await request(app).post(`/api/dev/orders/${orderId}/pay`);
    expect(paid.body.status).toBe("provisioning");
    const view = await request(app).get(`/api/orders/${orderId}`).query({ token });
    expect(view.body.status).toBe("fulfilled");
  });

  it("flags the order for a refund when the supplier fails", async () => {
    const supplier = new MockSupplier();
    vi.spyOn(supplier, "placeOrder").mockRejectedValue(new Error("Insufficient balance"));
    const { app, repo, notifier } = setup(supplier);
    const { orderId } = await checkout(app);
    await request(app).post(`/api/dev/orders/${orderId}/pay`);
    expect((await repo.get(orderId))!.status).toBe("fulfillment_failed");
    expect(notifier.fulfillmentFailed).toHaveBeenCalledTimes(1);
  });

  it("validates checkout input", async () => {
    const { app } = setup();
    const res = await request(app).post("/api/checkout").send({ countryCode: "GN", planCode: "x", email: "nope" });
    expect(res.status).toBe(400);
  });
});
