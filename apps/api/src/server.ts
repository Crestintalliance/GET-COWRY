import { createApp } from "./app.js";
import { CatalogService } from "./catalog.js";
import { loadConfig, parseRoutes } from "./config.js";
import { runMigrations } from "./db/migrate.js";
import { GooglePlacesSearch } from "./guides/places.js";
import { MemorySuggestionRepository, PgSuggestionRepository } from "./guides/suggestions.js";
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

// The default supplier first, then any other real supplier that's configured, for routed countries.
const routes = parseRoutes(cfg.SUPPLIER_ROUTES);
const sellers = [primary, ...[...suppliers.values()].filter((s) => s !== primary && s.id !== "mock")];
const catalog = new CatalogService(
  sellers,
  { minProfitCents: Math.round(cfg.PRICE_MIN_PROFIT_USD * 100), minMarkup: cfg.PRICE_MIN_MARKUP },
  Date.now,
  routes,
);

const useStripe = Boolean(cfg.STRIPE_SECRET_KEY && cfg.STRIPE_WEBHOOK_SECRET);
const payments = useStripe
  ? new StripePayments(cfg.STRIPE_SECRET_KEY!, cfg.STRIPE_WEBHOOK_SECRET!)
  : new DevPayments(cfg.PUBLIC_WEB_URL);

let repo;
let suggestions;
if (cfg.DATABASE_URL) {
  await runMigrations(cfg.DATABASE_URL);
  repo = PgOrderRepository.fromUrl(cfg.DATABASE_URL);
  suggestions = PgSuggestionRepository.fromUrl(cfg.DATABASE_URL);
} else {
  repo = new MemoryOrderRepository();
  suggestions = new MemorySuggestionRepository();
}
const orders = new OrderService(repo, catalog, suppliers, payments, new ConsoleNotifier(), cfg.PUBLIC_WEB_URL);

const app = createApp({
  catalog,
  orders,
  payments,
  devPayments: !useStripe && cfg.NODE_ENV !== "production",
  nearby: cfg.GOOGLE_PLACES_API_KEY ? new GooglePlacesSearch(cfg.GOOGLE_PLACES_API_KEY) : undefined,
  suggestions,
  adminToken: cfg.ADMIN_TOKEN,
  corsOrigins: [
    new URL(cfg.PUBLIC_WEB_URL).origin,
    ...cfg.CORS_EXTRA_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  ],
});

app.listen(cfg.PORT, () => {
  console.info(
    `JoinCowry API on http://localhost:${cfg.PORT} (supplier: ${cfg.SUPPLIER}, payments: ${useStripe ? "stripe" : "dev"}, db: ${cfg.DATABASE_URL ? "postgres" : "memory"}, places: ${cfg.GOOGLE_PLACES_API_KEY ? "google" : "off"})`,
  );
});
