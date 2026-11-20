import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import type { CatalogService } from "./catalog.js";
import { GUIDES } from "./guides/content/index.js";
import type { NearbySearch } from "./guides/places.js";
import type { SuggestionRepository } from "./guides/suggestions.js";
import { timingSafeEqual } from "node:crypto";
import { OrderError, type OrderService } from "./orders/service.js";
import type { PaymentProvider } from "./payments.js";

export interface AppDeps {
  catalog: CatalogService;
  orders: OrderService;
  payments: PaymentProvider;
  /** Enables POST /api/dev/orders/:id/pay. Never true in production. */
  devPayments: boolean;
  /** Website origins allowed to call the API from a browser. */
  corsOrigins?: string[];
  /** Google Places search for nearby restaurants and sights. Absent when no key is set. */
  nearby?: NearbySearch;
  /** Traveler recommendations, reviewed before they appear. */
  suggestions: SuggestionRepository;
  /** Token for the review screen. Review routes are off when it is not set. */
  adminToken?: string;
}

const SuggestionBody = z.object({
  category: z.enum(["eat", "do", "go"]),
  name: z.string().trim().min(2).max(120),
  area: z.string().trim().max(120).default(""),
  note: z.string().trim().max(600).default(""),
  submittedBy: z.string().trim().max(60).optional(),
  /** Hidden field; people never fill it, simple bots do. */
  website: z.string().max(0).optional(),
});

const Review = z.object({ status: z.enum(["approved", "rejected", "pending"]) });

/** At most `limit` submissions per IP per hour. Resets on restart; enough to stop casual floods. */
function rateLimiter(limit: number) {
  const hits = new Map<string, number[]>();
  return (ip: string) => {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < 3600_000);
    if (recent.length >= limit) return false;
    recent.push(now);
    hits.set(ip, recent);
    return true;
  };
}

function sameToken(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const NearbyQuery = z.object({
  kind: z.enum(["eat", "do"]).default("eat"),
  /** City the traveler typed for this stop; falls back to the guide's main city. */
  city: z.string().trim().max(80).optional(),
  lang: z.enum(["en", "fr", "es", "pt", "de"]).default("en"),
});

const CheckoutBody = z.object({
  countryCode: z.string().length(2),
  planCode: z.string().min(1).max(100),
  email: z.string().email().max(254),
  locale: z.enum(["en", "fr", "es", "pt", "de"]).default("en"),
});

const CountryParam = z.string().regex(/^[A-Za-z]{2}$/);

export function createApp(deps: AppDeps) {
  const app = express();
  app.disable("x-powered-by");
  // Render sits in front of the app; trust its one proxy hop so req.ip is the visitor.
  app.set("trust proxy", 1);

  if (deps.corsOrigins?.length) {
    const allowed = new Set(deps.corsOrigins);
    app.use((req, res, next) => {
      const origin = req.header("origin");
      if (origin && allowed.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      if (req.method === "OPTIONS") return void res.sendStatus(204);
      next();
    });
  }

  // Stripe needs the raw body to verify the signature, so this route comes before express.json().
  app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), async (req, res) => {
    let event;
    try {
      event = deps.payments.parseWebhook(req.body as Buffer, req.header("stripe-signature"));
    } catch {
      return void res.status(400).json({ error: "Invalid webhook" });
    }
    if (event.type === "paid") await deps.orders.handlePaid(event.orderId);
    res.json({ received: true });
  });

  app.use(express.json({ limit: "20kb" }));

  app.get("/api/health", (_req, res) => void res.json({ ok: true }));

  app.get("/api/countries", async (_req, res) => {
    res.json({ countries: await deps.catalog.countries() });
  });

  app.get("/api/countries/:code/plans", async (req, res) => {
    const code = CountryParam.safeParse(req.params.code);
    if (!code.success) return void res.status(400).json({ error: "Invalid country code" });
    const plans = await deps.catalog.plans(code.data.toUpperCase());
    res.json({
      plans: plans.map((p) => ({
        planCode: p.supplierPlanCode,
        countryCode: p.countryCode,
        countryName: p.countryName,
        name: p.name,
        dataBytes: p.dataBytes,
        validityDays: p.validityDays,
        priceCents: p.retailCents,
        currency: "usd",
        networks: p.networks,
      })),
    });
  });

  // Destination guide: personal picks, arrival basics, phrases and sights.
  // Every country has a guide screen: written content where it exists, plus approved traveler picks.
  app.get("/api/guides/:code", async (req, res) => {
    const code = CountryParam.safeParse(req.params.code);
    if (!code.success) return void res.status(400).json({ error: "Invalid country code" });
    const cc = code.data.toUpperCase();
    const approved = await deps.suggestions.list({ countryCode: cc, status: "approved" });
    // Approved picks should show right away, so phones always re-check.
    res.setHeader("Cache-Control", "no-cache");
    res.json({
      guide: GUIDES[cc] ?? null,
      community: approved.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        area: s.area,
        note: s.note,
        by: s.submittedBy ?? undefined,
      })),
      nearbyEnabled: Boolean(deps.nearby),
    });
  });

  const allowSubmit = rateLimiter(10);
  app.post("/api/guides/:code/suggestions", async (req, res) => {
    const code = CountryParam.safeParse(req.params.code);
    const body = SuggestionBody.safeParse(req.body);
    if (!code.success || !body.success) return void res.status(400).json({ error: "Invalid request" });
    if (!allowSubmit(req.ip ?? "unknown")) return void res.status(429).json({ error: "Too many submissions" });
    const { website: _honeypot, submittedBy, ...rest } = body.data;
    await deps.suggestions.add({ ...rest, countryCode: code.data.toUpperCase(), submittedBy: submittedBy || null });
    res.status(201).json({ ok: true });
  });

  if (deps.adminToken) {
    const token = deps.adminToken;
    const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
      const given = (req.header("authorization") ?? "").replace(/^Bearer /, "");
      if (!given || !sameToken(given, token)) return void res.status(401).json({ error: "Unauthorized" });
      next();
    };
    app.get("/api/admin/suggestions", requireAdmin, async (req, res) => {
      const status = Review.shape.status.safeParse(req.query.status);
      res.json({ suggestions: await deps.suggestions.list({ status: status.success ? status.data : "pending" }) });
    });
    app.post("/api/admin/suggestions/:id", requireAdmin, async (req, res) => {
      const body = Review.safeParse(req.body);
      if (!body.success) return void res.status(400).json({ error: "Invalid request" });
      const row = await deps.suggestions.setStatus(String(req.params.id), body.data.status);
      if (!row) return void res.status(404).json({ error: "Not found" });
      res.json({ suggestion: row });
    });
  }

  // Restaurants or sights from Google Maps, listed under the personal picks.
  app.get("/api/guides/:code/nearby", async (req, res) => {
    const code = CountryParam.safeParse(req.params.code);
    const q = NearbyQuery.safeParse(req.query);
    if (!code.success || !q.success) return void res.status(400).json({ error: "Invalid request" });
    if (!deps.nearby) return void res.json({ places: [], enabled: false });
    const cc = code.data.toUpperCase();
    const country = (await deps.catalog.countries()).find((c) => c.countryCode === cc);
    const city = q.data.city || GUIDES[cc]?.city || country?.countryName;
    if (!city) return void res.json({ places: [], enabled: true });
    try {
      const places = await deps.nearby.search(city, country?.countryName ?? cc, q.data.kind, q.data.lang);
      res.json({ places, enabled: true, attribution: "Google Maps" });
    } catch (err) {
      console.error(err);
      res.status(502).json({ error: "Nearby places are unavailable right now" });
    }
  });

  app.post("/api/checkout", async (req, res) => {
    const body = CheckoutBody.safeParse(req.body);
    if (!body.success) return void res.status(400).json({ error: "Invalid request", issues: body.error.issues });
    const result = await deps.orders.startCheckout({ ...body.data, countryCode: body.data.countryCode.toUpperCase() });
    res.status(201).json(result);
  });

  app.get("/api/orders/:id", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    res.json(await deps.orders.view(req.params.id, token));
  });

  if (deps.devPayments) {
    app.post("/api/dev/orders/:id/pay", async (req, res) => {
      const order = await deps.orders.handlePaid(req.params.id);
      if (!order) return void res.status(404).json({ error: "Order not found" });
      res.json({ status: order.status });
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof OrderError) return void res.status(err.status).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  });

  return app;
}
