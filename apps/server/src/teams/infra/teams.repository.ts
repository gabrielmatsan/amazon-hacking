import { desc, eq } from "drizzle-orm";

import { db } from "@/shared/infra/databases/postgres";
import { teamsSchema } from "../domain/teams.schema";
import type { Team } from "../domain/teams.type";

export const TeamsRepository = {
  async findAllPublic(): Promise<Pick<Team, "id" | "name" | "description" | "logoUrl">[]> {
    const teams = await db
      .select({
        id: teamsSchema.id,
        name: teamsSchema.name,
        description: teamsSchema.description,
        logoUrl: teamsSchema.logoUrl,
      })
      .from(teamsSchema)
      .orderBy(desc(teamsSchema.createdAt));

    return teams
  },

  async findById(id: string): Promise<Team | null> {
    const [team] = await db
      .select()
      .from(teamsSchema)
      .where(eq(teamsSchema.id, id));
      
    return team;
  },
};
