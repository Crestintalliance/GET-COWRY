import Stripe from "stripe";
import type { Order } from "./orders/types.js";

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export type PaymentEvent = { type: "paid"; orderId: string; sessionId: string } | { type: "ignored" };

export interface PaymentProvider {
  createCheckout(order: Order, urls: { success: string; cancel: string }): Promise<CheckoutSession>;
  /** Verify and decode a webhook. Throws if the signature is invalid. */
  parseWebhook(rawBody: Buffer, signature: string | undefined): PaymentEvent;
}

export class StripePayments implements PaymentProvider {
  private readonly stripe: Stripe;

  constructor(
    secretKey: string,
    private readonly webhookSecret: string,
  ) {
    this.stripe = new Stripe(secretKey);
  }

  async createCheckout(order: Order, urls: { success: string; cancel: string }): Promise<CheckoutSession> {
    const session = await this.stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: order.email,
        locale: order.locale,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: order.currency,
              unit_amount: order.retailCents,
              product_data: { name: `eSIM: ${order.planName}` },
            },
          },
        ],
        metadata: { orderId: order.id },
        payment_intent_data: { metadata: { orderId: order.id } },
        success_url: urls.success,
        cancel_url: urls.cancel,
      },
      { idempotencyKey: `checkout-${order.id}` },
    );
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return { sessionId: session.id, url: session.url };
  }

  parseWebhook(rawBody: Buffer, signature: string | undefined): PaymentEvent {
    if (!signature) throw new Error("Missing Stripe-Signature header");
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const s = event.data.object as Stripe.Checkout.Session;
      const orderId = s.metadata?.orderId;
      if (orderId && s.payment_status === "paid") return { type: "paid", orderId, sessionId: s.id };
    }
    return { type: "ignored" };
  }
}

/**
 * Development-only payments: no card is charged. Checkout sends the buyer to a
 * local page, and POST /api/dev/orders/:id/pay marks the order paid.
 */
export class DevPayments implements PaymentProvider {
  constructor(private readonly webUrl: string) {}

  async createCheckout(order: Order): Promise<CheckoutSession> {
    return { sessionId: `dev_${order.id}`, url: `${this.webUrl}/dev-pay?order=${order.id}&token=${order.publicToken}&lang=${order.locale}` };
  }

  parseWebhook(): PaymentEvent {
    throw new Error("DevPayments has no webhooks; use POST /api/dev/orders/:id/pay");
  }
}
