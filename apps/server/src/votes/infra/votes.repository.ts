import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { teamsSchema } from "@/teams/domain/teams.schema";
import { usersSchema } from "@/users/domain/users.schema";
import { and, count, eq } from "drizzle-orm";
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
}
