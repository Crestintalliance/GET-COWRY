import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  PUBLIC_WEB_URL: z.string().url().default("http://localhost:5173"),

  // Which supplier fills orders: "mock" for local development, "esimaccess" for real eSIMs.
  SUPPLIER: z.enum(["mock", "esimaccess"]).default("mock"),
  ESIMACCESS_BASE_URL: z.string().url().default("https://api.esimaccess.com/api/v1/open"),
  ESIMACCESS_ACCESS_CODE: z.string().optional(),
  ESIMACCESS_SECRET_KEY: z.string().optional(),

  // Payments
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Database. Leave empty to use the in-memory store (development only).
  DATABASE_URL: z.string().optional(),

  // Pricing rule (USD)
  PRICE_MIN_PROFIT_USD: z.coerce.number().nonnegative().default(4),
  PRICE_MIN_MARKUP: z.coerce.number().min(1).default(1.25),
});

export type Config = z.infer<typeof EnvSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const cfg = parsed.data;
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
