import type { Order } from "./orders/types.js";

/** Sends the customer their eSIM. Swap the console version for a real email provider before launch. */
export interface Notifier {
  esimReady(order: Order): Promise<void>;
  fulfillmentFailed(order: Order): Promise<void>;
}

export class ConsoleNotifier implements Notifier {
  async esimReady(order: Order): Promise<void> {
    console.info(`[notify] eSIM ready for order ${order.id} (${order.email}), ICCID ${order.iccid}`);
  }
  async fulfillmentFailed(order: Order): Promise<void> {
    console.error(`[notify] ACTION NEEDED: order ${order.id} paid but not fulfilled: ${order.failureReason}`);
  }
}
