import { desc, eq } from "drizzle-orm";

import { db } from "@/shared/infra/databases/postgres";
import { teamsSchema } from "../domain/teams.schema";
import type { Team, TeamMember } from "../domain/teams.type";

export type CreateTeamData = {
  name: string;
  description?: string;
  teamMembers?: TeamMember[];
};

export type UpdateTeamData = {
  name?: string;
  description?: string | null;
  teamMembers?: TeamMember[] | null;
};

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

  async create(data: CreateTeamData): Promise<Team> {
    const [team] = await db
      .insert(teamsSchema)
      .values({
        name: data.name,
        description: data.description ?? null,
        teamMembers: data.teamMembers ?? null,
      })
      .returning();

    return team;
  },

  async update(id: string, data: UpdateTeamData): Promise<Team | null> {
    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) values.name = data.name;
    if (data.description !== undefined) values.description = data.description;
    if (data.teamMembers !== undefined) values.teamMembers = data.teamMembers;

    const [team] = await db
      .update(teamsSchema)
      .set(values)
      .where(eq(teamsSchema.id, id))
      .returning();

    return team ?? null;
  },
};
