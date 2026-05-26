import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { teamsSchema } from "@/teams/domain/teams.schema";
import { usersSchema } from "@/users/domain/users.schema";
import { and, count, eq, lt, sql } from "drizzle-orm";
import { votesSchema, type NewVote } from "../domain/votes.schema";
import type { VoteType } from "../domain/votes.type";

export const VotesRepository = {
  async findByUserId(userId: string, tx?: Transaction) {
    const dbInstance = tx ?? db;
    const [vote] = await dbInstance
      .select()
      .from(votesSchema)
      .where(eq(votesSchema.userId, userId));

    return vote;
  },

  async findByPhoneNumber(phoneNumber: string, tx?: Transaction): Promise<VoteType | null> {
    const dbInstance = tx ?? db;
    const [vote] = await dbInstance
      .select()
      .from(votesSchema)
      .where(eq(votesSchema.phoneNumber, phoneNumber));
    return vote;
  },

  async create(data: NewVote, tx?: Transaction): Promise<VoteType | null> {
    const dbInstance = tx ?? db;
    const [vote] = await dbInstance
      .insert(votesSchema)
      .values(data)
      .onConflictDoNothing()
      .returning();
    return vote ?? null;
  },

  async countByNormalizedEmail(normalizedEmail: string): Promise<number> {
    const [row] = await db
      .select({ value: count() })
      .from(votesSchema)
      .innerJoin(usersSchema, eq(votesSchema.userId, usersSchema.id))
      .where(
        and(
          eq(usersSchema.normalizedEmail, normalizedEmail),
          eq(votesSchema.status, "valid"),
        ),
      );
    return Number(row?.value ?? 0);
  },

  async votesCount() {
    const votes = await db
      .select({
        teamId: teamsSchema.id,
        teamName: teamsSchema.name,
        votesCount: count()
      })
      .from(votesSchema)
      .innerJoin(teamsSchema, eq(votesSchema.teamId, teamsSchema.id))
      .where(eq(votesSchema.status, "valid"))
      .groupBy(teamsSchema.id)
    return votes;
  },

  async dashboardStats() {
    const [totals] = await db
      .select({
        total: count(),
        valid: count(sql`CASE WHEN ${votesSchema.status} = 'valid' THEN 1 END`),
        flagged: count(sql`CASE WHEN ${votesSchema.status} = 'flagged' THEN 1 END`),
        invalidated: count(sql`CASE WHEN ${votesSchema.status} = 'invalidated' THEN 1 END`),
        whatsapp: count(sql`CASE WHEN ${votesSchema.channel} = 'whatsapp' THEN 1 END`),
        email: count(sql`CASE WHEN ${votesSchema.channel} = 'email' THEN 1 END`),
      })
      .from(votesSchema);

    const perTeam = await db
      .select({
        teamId: teamsSchema.id,
        teamName: teamsSchema.name,
        teamSlug: teamsSchema.slug,
        logoUrl: teamsSchema.logoUrl,
        valid: count(sql`CASE WHEN ${votesSchema.status} = 'valid' THEN 1 END`),
        flagged: count(sql`CASE WHEN ${votesSchema.status} = 'flagged' THEN 1 END`),
        total: count(),
      })
      .from(votesSchema)
      .innerJoin(teamsSchema, eq(votesSchema.teamId, teamsSchema.id))
      .groupBy(teamsSchema.id)
      .orderBy(sql`count(CASE WHEN ${votesSchema.status} = 'valid' THEN 1 END) desc`);

    const recent = await db
      .select({
        id: votesSchema.id,
        status: votesSchema.status,
        channel: votesSchema.channel,
        teamName: teamsSchema.name,
        userName: usersSchema.name,
        userEmail: usersSchema.email,
        createdAt: votesSchema.createdAt,
      })
      .from(votesSchema)
      .innerJoin(teamsSchema, eq(votesSchema.teamId, teamsSchema.id))
      .innerJoin(usersSchema, eq(votesSchema.userId, usersSchema.id))
      .orderBy(sql`${votesSchema.createdAt} desc`)
      .limit(20);

    return { totals, perTeam, recent };
  },

  async findFlaggedCursor(cursor?: string, limit = 10) {
    const conditions = [eq(votesSchema.status, "flagged")];
    if (cursor) {
      const [cursorVote] = await db
        .select({ createdAt: votesSchema.createdAt })
        .from(votesSchema)
        .where(eq(votesSchema.id, cursor));
      if (cursorVote) {
        conditions.push(lt(votesSchema.createdAt, cursorVote.createdAt));
      }
    }

    const rows = await db
      .select({
        id: votesSchema.id,
        status: votesSchema.status,
        channel: votesSchema.channel,
        phoneNumber: votesSchema.phoneNumber,
        ipAddress: votesSchema.ipAddress,
        ipCountry: votesSchema.ipCountry,
        userAgent: votesSchema.userAgent,
        fingerprint: votesSchema.fingerprint,
        metadata: votesSchema.metadata,
        createdAt: votesSchema.createdAt,
        teamName: teamsSchema.name,
        teamSlug: teamsSchema.slug,
        userName: usersSchema.name,
        userEmail: usersSchema.email,
      })
      .from(votesSchema)
      .innerJoin(teamsSchema, eq(votesSchema.teamId, teamsSchema.id))
      .innerJoin(usersSchema, eq(votesSchema.userId, usersSchema.id))
      .where(and(...conditions))
      .orderBy(sql`${votesSchema.createdAt} desc`)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? items[items.length - 1].id : null;

    return { items, nextCursor };
  },

  async updateStatus(id: string, status: "valid" | "flagged" | "invalidated") {
    const [vote] = await db
      .update(votesSchema)
      .set({ status })
      .where(eq(votesSchema.id, id))
      .returning();
    return vote ?? null;
  },
}
