import { createApp } from "./app.js";
import { CatalogService } from "./catalog.js";
import { loadConfig } from "./config.js";
import { PgOrderRepository } from "./db/pgRepo.js";
import { ConsoleNotifier } from "./notify.js";
import { MemoryOrderRepository } from "./orders/memoryRepo.js";
import { OrderService } from "./orders/service.js";
import { DevPayments, StripePayments } from "./payments.js";
import { buildSuppliers } from "./suppliers/index.js";

const cfg = loadConfig();
const suppliers = buildSuppliers(cfg);
const primary = suppliers.get(cfg.SUPPLIER);
if (!primary) throw new Error(`Supplier ${cfg.SUPPLIER} is not configured`);

const catalog = new CatalogService(primary, {
  minProfitCents: Math.round(cfg.PRICE_MIN_PROFIT_USD * 100),
  minMarkup: cfg.PRICE_MIN_MARKUP,
});

const useStripe = Boolean(cfg.STRIPE_SECRET_KEY && cfg.STRIPE_WEBHOOK_SECRET);
const payments = useStripe
  ? new StripePayments(cfg.STRIPE_SECRET_KEY!, cfg.STRIPE_WEBHOOK_SECRET!)
  : new DevPayments(cfg.PUBLIC_WEB_URL);

const repo = cfg.DATABASE_URL ? PgOrderRepository.fromUrl(cfg.DATABASE_URL) : new MemoryOrderRepository();
const orders = new OrderService(repo, catalog, suppliers, payments, new ConsoleNotifier(), cfg.PUBLIC_WEB_URL);

const app = createApp({
  catalog,
  orders,
  payments,
  devPayments: !useStripe && cfg.NODE_ENV !== "production",
  corsOrigin: cfg.PUBLIC_WEB_URL,
});

app.listen(cfg.PORT, () => {
  console.info(
    `Get Cowry API on http://localhost:${cfg.PORT} (supplier: ${cfg.SUPPLIER}, payments: ${useStripe ? "stripe" : "dev"}, db: ${cfg.DATABASE_URL ? "postgres" : "memory"})`,
  );
});
