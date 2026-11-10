/**
 * Supplier-neutral types. The app only talks to `SupplierAdapter`; each eSIM
 * wholesaler (eSIM Access today, others later) gets its own adapter file.
 */

export type SupplierId = "mock" | "esimaccess";

export interface Network {
  operator: string; // e.g. "Orange"
  type: string; // e.g. "4G"
}

export interface SupplierPlan {
  supplier: SupplierId;
  /** The supplier's own package code. Needed to order and to top up. */
  supplierPlanCode: string;
  countryCode: string; // ISO 3166-1 alpha-2, e.g. "GN"
  countryName: string;
  name: string;
  dataBytes: number;
  validityDays: number;
  /** What Cowry pays the supplier, in US cents. */
  wholesaleCents: number;
  networks: Network[];
}

export interface IssuedEsim {
  iccid: string;
  /** LPA activation string, e.g. "LPA:1$smdp.example.com$ABC123". Render a QR code from it. */
  activationCode: string;
  qrCodeUrl?: string;
  /** Supplier's own reference for this eSIM (used for usage and top-ups). */
  supplierEsimRef?: string;
}

export interface PlaceOrderInput {
  plan: SupplierPlan;
  /** Our own unique id. Sent to the supplier so a retried order is not charged twice. */
  idempotencyKey: string;
}

export type PlaceOrderResult =
  | { status: "issued"; supplierOrderRef: string; esim: IssuedEsim }
  | { status: "pending"; supplierOrderRef: string };

export interface SupplierAdapter {
  readonly id: SupplierId;
  listPlans(countryCode?: string): Promise<SupplierPlan[]>;
  placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;
  /** Look up an order placed earlier. Returns the eSIM once the supplier has issued it. */
  getOrderEsim(supplierOrderRef: string): Promise<IssuedEsim | null>;
}

export class SupplierError extends Error {
  constructor(
    message: string,
    readonly supplier: SupplierId,
    readonly code?: string,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "SupplierError";
  }
}
