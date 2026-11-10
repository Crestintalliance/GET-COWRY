import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import type { CatalogService } from "./catalog.js";
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
}

const CheckoutBody = z.object({
  countryCode: z.string().length(2),
  planCode: z.string().min(1).max(100),
  email: z.string().email().max(254),
  locale: z.enum(["en", "fr"]).default("en"),
});

const CountryParam = z.string().regex(/^[A-Za-z]{2}$/);

export function createApp(deps: AppDeps) {
  const app = express();
  app.disable("x-powered-by");

  if (deps.corsOrigins?.length) {
    const allowed = new Set(deps.corsOrigins);
    app.use((req, res, next) => {
      const origin = req.header("origin");
      if (origin && allowed.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
      }
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
