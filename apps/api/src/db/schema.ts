import { bigint, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey(),
  publicToken: text("public_token").notNull(),
  email: text("email").notNull(),
  locale: text("locale").notNull().default("en"),
  status: text("status").notNull(),

  supplier: text("supplier").notNull(),
  supplierPlanCode: text("supplier_plan_code").notNull(),
  countryCode: text("country_code").notNull(),
  planName: text("plan_name").notNull(),
  dataBytes: bigint("data_bytes", { mode: "number" }).notNull(),
  validityDays: integer("validity_days").notNull(),
  wholesaleCents: integer("wholesale_cents").notNull(),
  retailCents: integer("retail_cents").notNull(),
  currency: text("currency").notNull().default("usd"),

  stripeSessionId: text("stripe_session_id"),
  supplierOrderRef: text("supplier_order_ref"),
  iccid: text("iccid"),
  activationCode: text("activation_code"),
  qrCodeUrl: text("qr_code_url"),
  supplierEsimRef: text("supplier_esim_ref"),
  failureReason: text("failure_reason"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
