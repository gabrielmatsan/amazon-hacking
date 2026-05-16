import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { count, eq } from "drizzle-orm";
import { votesSchema, type NewVote } from "../domain/votes.schema";
import type { VoteType } from "../domain/votes.type";
import { teamsSchema } from "@/teams/domain/teams.schema";

export const VotesRepository = {
  async findByUserId(userId: string, tx?: Transaction) {
    const dbInstance = tx ?? db;
    const [vote] = await dbInstance
      .select()
      .from(votesSchema)
      .where(eq(votesSchema.userId, userId));

    return vote;
  },

  async create(data: NewVote, tx?: Transaction): Promise<VoteType | null> {
    const dbInstance = tx ?? db;
    const [vote] = await dbInstance
      .insert(votesSchema)
      .values(data)
      .onConflictDoNothing({ target: [votesSchema.userId] })
      .returning();
    return vote ?? null;
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
