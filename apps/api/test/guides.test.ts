import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createApp } from "../src/app.js";
import { CatalogService } from "../src/catalog.js";
import { GooglePlacesSearch, type NearbySearch } from "../src/guides/places.js";
import { MemorySuggestionRepository } from "../src/guides/suggestions.js";
import { MemoryOrderRepository } from "../src/orders/memoryRepo.js";
import { OrderService } from "../src/orders/service.js";
import { DevPayments } from "../src/payments.js";
import { MockSupplier } from "../src/suppliers/mock.js";

const TOKEN = "a-long-admin-token-for-tests-123";

function setup(nearby?: NearbySearch) {
  const supplier = new MockSupplier();
  const catalog = new CatalogService(supplier, { minProfitCents: 300, minMarkup: 1.25 });
  const payments = new DevPayments("http://web.test");
  const orders = new OrderService(
    new MemoryOrderRepository(),
    catalog,
    new Map([["mock", supplier]]),
    payments,
    { esimReady: vi.fn(async () => undefined), fulfillmentFailed: vi.fn(async () => undefined) },
    "http://web.test",
  );
  const suggestions = new MemorySuggestionRepository();
  const app = createApp({ catalog, orders, payments, devPayments: true, suggestions, adminToken: TOKEN, nearby });
  return { app, suggestions };
}

describe("guides", () => {
  it("returns a guide screen for any country, written or not", async () => {
    const { app } = setup();
    const gn = await request(app).get("/api/guides/gn");
    expect(gn.status).toBe(200);
    expect(gn.body.guide.country).toBe("GN");
    const zm = await request(app).get("/api/guides/zm");
    expect(zm.status).toBe(200);
    expect(zm.body.guide).toBeNull();
    expect(zm.body.community).toEqual([]);
    expect(zm.body.nearbyEnabled).toBe(false);
  });

  it("shows a traveler's pick only after it is approved", async () => {
    const { app } = setup();
    const sent = await request(app)
      .post("/api/guides/zm/suggestions")
      .send({ category: "eat", name: "Mama's Kitchen", area: "Lusaka", note: "Best nshima", submittedBy: "Chanda" });
    expect(sent.status).toBe(201);
    expect((await request(app).get("/api/guides/zm")).body.community).toHaveLength(0);

    const auth = { Authorization: `Bearer ${TOKEN}` };
    expect((await request(app).get("/api/admin/suggestions")).status).toBe(401);
    const pending = await request(app).get("/api/admin/suggestions").set(auth);
    expect(pending.body.suggestions).toHaveLength(1);
    const id = pending.body.suggestions[0].id;
    expect((await request(app).post(`/api/admin/suggestions/${id}`).set(auth).send({ status: "approved" })).status).toBe(200);

    const community = (await request(app).get("/api/guides/zm")).body.community;
    expect(community).toEqual([
      { id, name: "Mama's Kitchen", category: "eat", area: "Lusaka", note: "Best nshima", by: "Chanda" },
    ]);
  });

  it("rejects bot submissions and bad input", async () => {
    const { app } = setup();
    const bot = await request(app).post("/api/guides/gn/suggestions").send({ category: "eat", name: "Spam", website: "x.com" });
    expect(bot.status).toBe(400);
    const bad = await request(app).post("/api/guides/gn/suggestions").send({ category: "bar", name: "X" });
    expect(bad.status).toBe(400);
  });

  it("lists nearby places when a search is configured", async () => {
    const search: NearbySearch = {
      search: vi.fn(async () => [{ id: "p1", name: "Le Damier", address: "Conakry", mapsUrl: "https://maps.google.com/?cid=1" }]),
    };
    const { app } = setup(search);
    const res = await request(app).get("/api/guides/gn/nearby?kind=eat&lang=fr");
    expect(res.status).toBe(200);
    expect(res.body.places[0].name).toBe("Le Damier");
    expect(search.search).toHaveBeenCalledWith("Conakry", "Guinea", "eat", "fr");
  });
});

describe("GooglePlacesSearch", () => {
  it("maps Google's response and reuses it for repeat views", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(
        JSON.stringify({
          places: [
            {
              id: "abc",
              displayName: { text: "Marché Madina" },
              formattedAddress: "Conakry, Guinea",
              rating: 4.1,
              userRatingCount: 220,
              googleMapsUri: "https://maps.google.com/?cid=9",
              primaryTypeDisplayName: { text: "Market" },
            },
          ],
        }),
      ),
    );
    const g = new GooglePlacesSearch("key", 60_000, fetchFn as unknown as typeof fetch);
    const a = await g.search("Conakry", "Guinea", "do", "en");
    await g.search("Conakry", "Guinea", "do", "en");
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(a).toEqual([
      { id: "abc", name: "Marché Madina", address: "Conakry, Guinea", rating: 4.1, ratingCount: 220, type: "Market", mapsUrl: "https://maps.google.com/?cid=9" },
    ]);
  });
});
