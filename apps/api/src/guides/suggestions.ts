import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import { suggestions } from "../db/schema.js";

export type SuggestionStatus = "pending" | "approved" | "rejected";

export interface Suggestion {
  id: string;
  countryCode: string;
  category: "eat" | "do" | "go";
  name: string;
  area: string;
  note: string;
  submittedBy: string | null;
  status: SuggestionStatus;
  createdAt: Date;
}

export type NewSuggestion = Pick<Suggestion, "countryCode" | "category" | "name" | "area" | "note" | "submittedBy">;

export interface SuggestionRepository {
  add(s: NewSuggestion): Promise<Suggestion>;
  list(filter: { countryCode?: string; status?: SuggestionStatus }): Promise<Suggestion[]>;
  setStatus(id: string, status: SuggestionStatus): Promise<Suggestion | null>;
}

export class MemorySuggestionRepository implements SuggestionRepository {
  private rows: Suggestion[] = [];

  async add(s: NewSuggestion): Promise<Suggestion> {
    const row: Suggestion = { ...s, id: randomUUID(), status: "pending", createdAt: new Date() };
    this.rows.unshift(row);
    return row;
  }

  async list(filter: { countryCode?: string; status?: SuggestionStatus }): Promise<Suggestion[]> {
    return this.rows.filter(
      (r) => (!filter.countryCode || r.countryCode === filter.countryCode) && (!filter.status || r.status === filter.status),
    );
  }

  async setStatus(id: string, status: SuggestionStatus): Promise<Suggestion | null> {
    const row = this.rows.find((r) => r.id === id);
    if (!row) return null;
    row.status = status;
    return row;
  }
}

export class PgSuggestionRepository implements SuggestionRepository {
  constructor(private readonly db: NodePgDatabase) {}

  static fromUrl(url: string): PgSuggestionRepository {
    return new PgSuggestionRepository(drizzle(new pg.Pool({ connectionString: url, max: 3 })));
  }

  async add(s: NewSuggestion): Promise<Suggestion> {
    const [row] = await this.db
      .insert(suggestions)
      .values({ ...s, id: randomUUID(), status: "pending" })
      .returning();
    return row as unknown as Suggestion;
  }

  async list(filter: { countryCode?: string; status?: SuggestionStatus }): Promise<Suggestion[]> {
    const where = and(
      filter.countryCode ? eq(suggestions.countryCode, filter.countryCode) : undefined,
      filter.status ? eq(suggestions.status, filter.status) : undefined,
    );
    const rows = await this.db.select().from(suggestions).where(where).orderBy(desc(suggestions.createdAt)).limit(500);
    return rows as unknown as Suggestion[];
  }

  async setStatus(id: string, status: SuggestionStatus): Promise<Suggestion | null> {
    const [row] = await this.db
      .update(suggestions)
      .set({ status, reviewedAt: new Date() })
      .where(eq(suggestions.id, id))
      .returning();
    return (row as unknown as Suggestion) ?? null;
  }
}
