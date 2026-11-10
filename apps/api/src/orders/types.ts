import type { SupplierId } from "../suppliers/types.js";

export type OrderStatus =
  | "awaiting_payment" // checkout started, not paid
  | "paid" // payment confirmed, ordering from supplier
  | "provisioning" // supplier accepted, eSIM not issued yet
  | "fulfilled" // eSIM issued and sent to the customer
  | "fulfillment_failed"; // paid but supplier failed: needs a refund or retry

export type Locale = "en" | "fr";

export interface Order {
  id: string;
  /** Secret given only to the buyer, required to view the order and its eSIM. */
  publicToken: string;
  email: string;
  locale: Locale;
  status: OrderStatus;

  supplier: SupplierId;
  supplierPlanCode: string;
  countryCode: string;
  planName: string;
  dataBytes: number;
  validityDays: number;
  wholesaleCents: number;
  retailCents: number;
  currency: "usd";

  stripeSessionId?: string | null;
  supplierOrderRef?: string | null;
  iccid?: string | null;
  activationCode?: string | null;
  qrCodeUrl?: string | null;
  supplierEsimRef?: string | null;
  failureReason?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export type NewOrder = Omit<Order, "createdAt" | "updatedAt">;

export interface OrderRepository {
  create(order: NewOrder): Promise<Order>;
  get(id: string): Promise<Order | null>;
  update(id: string, patch: Partial<NewOrder>): Promise<Order>;
  /**
   * Move an order from one status to another only if it is still in `from`.
   * Returns the updated order, or null if another process got there first.
   * Stops a payment webhook delivered twice from ordering two eSIMs.
   */
  transition(id: string, from: OrderStatus, to: OrderStatus): Promise<Order | null>;
}
