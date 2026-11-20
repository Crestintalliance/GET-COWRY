import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  PUBLIC_WEB_URL: z.string().url().default("http://localhost:5173"),
  /** Extra website origins allowed to call the API, comma-separated (e.g. https://www.joincowry.com). */
  CORS_EXTRA_ORIGINS: z.string().default(""),

  // Which supplier fills orders: "mock" for local development, "esimaccess" for real eSIMs.
  SUPPLIER: z.enum(["mock", "esimaccess", "airalo"]).default("mock"),
  /** Countries sold by a specific supplier, e.g. "GN:esimaccess,CI:esimaccess". Others use SUPPLIER. */
  SUPPLIER_ROUTES: z.string().default(""),
  AIRALO_BASE_URL: z.string().url().default("https://partners-api.airalo.com/v2"),
  AIRALO_CLIENT_ID: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  AIRALO_CLIENT_SECRET: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  ESIMACCESS_BASE_URL: z.string().url().default("https://api.esimaccess.com/api/v1/open"),
  ESIMACCESS_ACCESS_CODE: z.string().optional(),
  ESIMACCESS_SECRET_KEY: z.string().optional(),

  // Payments
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Google Places API key for restaurant and sight listings in destination guides (optional).
  GOOGLE_PLACES_API_KEY: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),

  // Password for the suggestion review screen (/admin on the website). Review is off when empty.
  ADMIN_TOKEN: z.preprocess((v) => (v === "" ? undefined : v), z.string().min(24).optional()),

  // Database. Leave empty to use the in-memory store (development only).
  DATABASE_URL: z.string().optional(),

  // Pricing rule (USD)
  PRICE_MIN_PROFIT_USD: z.coerce.number().nonnegative().default(4),
  PRICE_MIN_MARKUP: z.coerce.number().min(1).default(1.25),
});

export type Config = z.infer<typeof EnvSchema>;

/** "GN:esimaccess, CI:esimaccess" → Map { GN → esimaccess, CI → esimaccess }. */
export function parseRoutes(value: string): Map<string, "mock" | "esimaccess" | "airalo"> {
  const routes = new Map<string, "mock" | "esimaccess" | "airalo">();
  for (const part of value.split(",")) {
    const [cc, supplier] = part.split(":").map((x) => x.trim());
    if (cc && /^[A-Za-z]{2}$/.test(cc) && (supplier === "mock" || supplier === "esimaccess" || supplier === "airalo")) {
      routes.set(cc.toUpperCase(), supplier);
    }
  }
  return routes;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const cfg = parsed.data;
  if (cfg.SUPPLIER === "airalo" && !(cfg.AIRALO_CLIENT_ID && cfg.AIRALO_CLIENT_SECRET)) {
    throw new Error("SUPPLIER=airalo requires AIRALO_CLIENT_ID and AIRALO_CLIENT_SECRET");
  }
  if (cfg.SUPPLIER === "esimaccess" && !cfg.ESIMACCESS_ACCESS_CODE) {
    throw new Error("SUPPLIER=esimaccess requires ESIMACCESS_ACCESS_CODE");
  }
  if (cfg.NODE_ENV === "production") {
    const missing = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "DATABASE_URL"].filter(
      (k) => !cfg[k as keyof Config],
    );
    if (missing.length) throw new Error(`Production requires: ${missing.join(", ")}`);
  }
  return cfg;
}
