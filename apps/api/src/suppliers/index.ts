import type { Config } from "../config.js";
import { EsimAccessAdapter } from "./esimaccess.js";
import { MockSupplier } from "./mock.js";
import type { SupplierAdapter, SupplierId } from "./types.js";

export * from "./types.js";

/** Build every configured supplier. Orders remember which supplier issued them, for top-ups and refunds. */
export function buildSuppliers(cfg: Config): Map<SupplierId, SupplierAdapter> {
  const map = new Map<SupplierId, SupplierAdapter>();
  map.set("mock", new MockSupplier());
  if (cfg.ESIMACCESS_ACCESS_CODE) {
    map.set(
      "esimaccess",
      new EsimAccessAdapter({
        baseUrl: cfg.ESIMACCESS_BASE_URL,
        accessCode: cfg.ESIMACCESS_ACCESS_CODE,
        secretKey: cfg.ESIMACCESS_SECRET_KEY,
      }),
    );
  }
  return map;
}
