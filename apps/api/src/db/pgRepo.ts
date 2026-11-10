import { and, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import type { NewOrder, Order, OrderRepository, OrderStatus } from "../orders/types.js";
import { orders } from "./schema.js";

type Row = typeof orders.$inferSelect;

function toOrder(r: Row): Order {
  return r as unknown as Order;
}

export class PgOrderRepository implements OrderRepository {
  constructor(private readonly db: NodePgDatabase) {}

  static fromUrl(url: string): PgOrderRepository {
    return new PgOrderRepository(drizzle(new pg.Pool({ connectionString: url })));
  }

  async create(order: NewOrder): Promise<Order> {
    const [row] = await this.db.insert(orders).values(order).returning();
    return toOrder(row!);
  }

  async get(id: string): Promise<Order | null> {
    const [row] = await this.db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return row ? toOrder(row) : null;
  }

  async update(id: string, patch: Partial<NewOrder>): Promise<Order> {
    const [row] = await this.db
      .update(orders)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    if (!row) throw new Error(`Order ${id} not found`);
    return toOrder(row);
  }

  async transition(id: string, from: OrderStatus, to: OrderStatus): Promise<Order | null> {
    const [row] = await this.db
      .update(orders)
      .set({ status: to, updatedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.status, from)))
      .returning();
    return row ? toOrder(row) : null;
  }
}
