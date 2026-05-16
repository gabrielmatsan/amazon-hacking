import { desc, eq } from "drizzle-orm";

import { db } from "@/shared/infra/databases/postgres";
import { teamsSchema, type Team } from "@/teams/domain/teams.schema";

export const TeamsRepository = {
  async findAllPublic(): Promise<Pick<Team, "id" | "name" | "description" | "logoUrl">[]> {
    return db
      .select({
        id: teamsSchema.id,
        name: teamsSchema.name,
        description: teamsSchema.description,
        logoUrl: teamsSchema.logoUrl,
      })
      .from(teamsSchema)
      .orderBy(desc(teamsSchema.createdAt));
  },

  async findById(id: string): Promise<Team | null> {
    const [team] = await db
      .select()
      .from(teamsSchema)
      .where(eq(teamsSchema.id, id));
    return team;
  },
};
