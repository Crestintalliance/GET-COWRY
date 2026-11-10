import { randomBytes, randomUUID } from "node:crypto";
import type { CatalogService } from "../catalog.js";
import type { Notifier } from "../notify.js";
import type { PaymentProvider } from "../payments.js";
import type { SupplierAdapter, SupplierId } from "../suppliers/types.js";
import type { Locale, Order, OrderRepository } from "./types.js";

export class OrderError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface StartCheckoutInput {
  countryCode: string;
  planCode: string;
  email: string;
  locale: Locale;
}

export class OrderService {
  constructor(
    private readonly repo: OrderRepository,
    private readonly catalog: CatalogService,
    private readonly suppliers: Map<SupplierId, SupplierAdapter>,
    private readonly payments: PaymentProvider,
    private readonly notifier: Notifier,
    private readonly webUrl: string,
  ) {}

  async startCheckout(input: StartCheckoutInput): Promise<{ orderId: string; token: string; checkoutUrl: string }> {
    const plan = await this.catalog.findPlan(input.countryCode, input.planCode);
    if (!plan) throw new OrderError("Plan not available", 404);

    const order = await this.repo.create({
      id: randomUUID(),
      publicToken: randomBytes(24).toString("base64url"),
      email: input.email,
      locale: input.locale,
      status: "awaiting_payment",
      supplier: plan.supplier,
      supplierPlanCode: plan.supplierPlanCode,
      countryCode: plan.countryCode,
      planName: plan.name,
      dataBytes: plan.dataBytes,
      validityDays: plan.validityDays,
      wholesaleCents: plan.wholesaleCents,
      retailCents: plan.retailCents,
      currency: "usd",
    });

    const base = `${this.webUrl}/${order.locale}/order/${order.id}?token=${order.publicToken}`;
    const session = await this.payments.createCheckout(order, {
      success: base,
      cancel: `${this.webUrl}/${order.locale}/countries/${order.countryCode.toLowerCase()}`,
    });
    await this.repo.update(order.id, { stripeSessionId: session.sessionId });
    return { orderId: order.id, token: order.publicToken, checkoutUrl: session.url };
  }

  /**
   * Called once payment is confirmed. Safe to call more than once: only the
   * first call moves the order out of awaiting_payment and orders the eSIM.
   */
  async handlePaid(orderId: string): Promise<Order | null> {
    const order = await this.repo.transition(orderId, "awaiting_payment", "paid");
    if (!order) return this.repo.get(orderId);

    const supplier = this.suppliers.get(order.supplier);
    if (!supplier) return this.fail(order, `Supplier ${order.supplier} is not configured`);

    try {
      const result = await supplier.placeOrder({
        idempotencyKey: order.id,
        plan: {
          supplier: order.supplier,
          supplierPlanCode: order.supplierPlanCode,
          countryCode: order.countryCode,
          countryName: order.countryCode,
          name: order.planName,
          dataBytes: order.dataBytes,
          validityDays: order.validityDays,
          wholesaleCents: order.wholesaleCents,
          networks: [],
        },
      });
      if (result.status === "issued") {
        const done = await this.repo.update(order.id, {
          status: "fulfilled",
          supplierOrderRef: result.supplierOrderRef,
          iccid: result.esim.iccid,
          activationCode: result.esim.activationCode,
          qrCodeUrl: result.esim.qrCodeUrl ?? null,
          supplierEsimRef: result.esim.supplierEsimRef ?? null,
        });
        await this.notifier.esimReady(done);
        return done;
      }
      return this.repo.update(order.id, { status: "provisioning", supplierOrderRef: result.supplierOrderRef });
    } catch (err) {
      return this.fail(order, err instanceof Error ? err.message : String(err));
    }
  }

  /** For orders the supplier accepted but had not issued yet: check again. */
  async refresh(order: Order): Promise<Order> {
    if (order.status !== "provisioning" || !order.supplierOrderRef) return order;
    const supplier = this.suppliers.get(order.supplier);
    if (!supplier) return order;
    const esim = await supplier.getOrderEsim(order.supplierOrderRef).catch(() => null);
    if (!esim) return order;
    const done = await this.repo.update(order.id, {
      status: "fulfilled",
      iccid: esim.iccid,
      activationCode: esim.activationCode,
      qrCodeUrl: esim.qrCodeUrl ?? null,
      supplierEsimRef: esim.supplierEsimRef ?? null,
    });
    await this.notifier.esimReady(done);
    return done;
  }

  /** Buyer-facing view. Requires the order's secret token. */
  async view(orderId: string, token: string) {
    const found = await this.repo.get(orderId);
    if (!found || found.publicToken !== token) throw new OrderError("Order not found", 404);
    const order = await this.refresh(found);
    return {
      id: order.id,
      status: order.status,
      planName: order.planName,
      countryCode: order.countryCode,
      dataBytes: order.dataBytes,
      validityDays: order.validityDays,
      retailCents: order.retailCents,
      currency: order.currency,
      esim:
        order.status === "fulfilled"
          ? { iccid: order.iccid, activationCode: order.activationCode, qrCodeUrl: order.qrCodeUrl }
          : null,
    };
  }

  private async fail(order: Order, reason: string): Promise<Order> {
    const failed = await this.repo.update(order.id, { status: "fulfillment_failed", failureReason: reason });
    await this.notifier.fulfillmentFailed(failed);
    return failed;
  }
}
