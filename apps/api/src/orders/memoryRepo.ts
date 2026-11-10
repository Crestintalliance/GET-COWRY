import type { NewOrder, Order, OrderRepository, OrderStatus } from "./types.js";

/** In-memory store for local development and tests. Data is lost on restart. */
export class MemoryOrderRepository implements OrderRepository {
  private readonly rows = new Map<string, Order>();

  async create(order: NewOrder): Promise<Order> {
    const now = new Date();
    const row: Order = { ...order, createdAt: now, updatedAt: now };
    this.rows.set(row.id, row);
    return { ...row };
  }

  async get(id: string): Promise<Order | null> {
    const row = this.rows.get(id);
    return row ? { ...row } : null;
  }

  async update(id: string, patch: Partial<NewOrder>): Promise<Order> {
    const row = this.rows.get(id);
    if (!row) throw new Error(`Order ${id} not found`);
    const next: Order = { ...row, ...patch, updatedAt: new Date() };
    this.rows.set(id, next);
    return { ...next };
  }

  async transition(id: string, from: OrderStatus, to: OrderStatus): Promise<Order | null> {
    const row = this.rows.get(id);
    if (!row || row.status !== from) return null;
    return this.update(id, { status: to });
  }
}
