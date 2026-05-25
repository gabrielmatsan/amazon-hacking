import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { and, count, desc, eq, gt, or, sql } from "drizzle-orm";
import {
  votesTokensSchema,
  type NewVoteTokenInput,
  type VoteTokenRow,
} from "../domain/votes-tokens.schema";

export const VoteTokensRepository = {
  async findValidByUserAndHash(
    userId: string,
    tokenHash: string,
    tx?: Transaction,
  ): Promise<VoteTokenRow | null> {
    const dbInstance = tx ?? db;
    const [row] = await dbInstance
      .select()
      .from(votesTokensSchema)
      .where(
        and(
          eq(votesTokensSchema.userId, userId),
          eq(votesTokensSchema.tokenHash, tokenHash),
          eq(votesTokensSchema.status, "valid"),
          gt(votesTokensSchema.expiresAt, new Date()),
        ),
      );
    return row ?? null;
  },

  async findLatestValidByUser(
    userId: string,
    tx?: Transaction,
  ): Promise<VoteTokenRow | null> {
    const dbInstance = tx ?? db;
    const [row] = await dbInstance
      .select()
      .from(votesTokensSchema)
      .where(
        and(
          eq(votesTokensSchema.userId, userId),
          eq(votesTokensSchema.status, "valid"),
        ),
      )
      .orderBy(desc(votesTokensSchema.createdAt))
      .limit(1);
    return row ?? null;
  },

  async countRecent(
    userId: string,
    phoneNumber: string,
    windowSeconds: number,
  ): Promise<number> {
    const since = new Date(Date.now() - windowSeconds * 1000);
    const [row] = await db
      .select({ value: count() })
      .from(votesTokensSchema)
      .where(
        and(
          gt(votesTokensSchema.createdAt, since),
          or(
            eq(votesTokensSchema.userId, userId),
            eq(votesTokensSchema.phoneNumber, phoneNumber),
          ),
        ),
      );
    return Number(row?.value ?? 0);
  },

  async countRecentByIp(
    ipAddress: string,
    windowSeconds: number,
  ): Promise<number> {
    const since = new Date(Date.now() - windowSeconds * 1000);
    const [row] = await db
      .select({ value: count() })
      .from(votesTokensSchema)
      .where(
        and(
          gt(votesTokensSchema.createdAt, since),
          eq(votesTokensSchema.ipAddress, ipAddress),
        ),
      );
    return Number(row?.value ?? 0);
  },

  async findActiveByPhoneOtherUser(
    phoneNumber: string,
    excludeUserId: string,
  ): Promise<VoteTokenRow | null> {
    const [row] = await db
      .select()
      .from(votesTokensSchema)
      .where(
        and(
          eq(votesTokensSchema.phoneNumber, phoneNumber),
          eq(votesTokensSchema.status, "valid"),
          gt(votesTokensSchema.expiresAt, new Date()),
          sql`${votesTokensSchema.userId} <> ${excludeUserId}`,
        ),
      )
      .limit(1);
    return row ?? null;
  },

  async supersedePreviousValidByUser(
    userId: string,
    tx?: Transaction,
  ): Promise<number> {
    const dbInstance = tx ?? db;
    const updated = await dbInstance
      .update(votesTokensSchema)
      .set({ status: "superseded" })
      .where(
        and(
          eq(votesTokensSchema.userId, userId),
          eq(votesTokensSchema.status, "valid"),
        ),
      )
      .returning({ id: votesTokensSchema.id });
    return updated.length;
  },

  async create(data: NewVoteTokenInput, tx?: Transaction): Promise<VoteTokenRow> {
    const dbInstance = tx ?? db;
    const [row] = await dbInstance
      .insert(votesTokensSchema)
      .values(data)
      .returning();
    return row;
  },

  async markAsUsed(id: string, tx?: Transaction): Promise<void> {
    const dbInstance = tx ?? db;
    await dbInstance
      .update(votesTokensSchema)
      .set({ status: "used" })
      .where(eq(votesTokensSchema.id, id));
  },

  async incrementAttempts(id: string, tx?: Transaction): Promise<number> {
    const dbInstance = tx ?? db;
    const [row] = await dbInstance
      .update(votesTokensSchema)
      .set({ attempts: sql`${votesTokensSchema.attempts} + 1` })
      .where(eq(votesTokensSchema.id, id))
      .returning({ attempts: votesTokensSchema.attempts });
    return row?.attempts ?? 0;
  },
};
