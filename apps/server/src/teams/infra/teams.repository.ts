import { eq, sql } from "drizzle-orm";

import { db } from "@/shared/infra/databases/postgres";
import { teamsSchema, type NewTeam } from "../domain/teams.schema";
import type { SolutionPillar, Team, TeamMember } from "../domain/teams.type";

export type UpdateTeamData = {
  name?: string;
  description?: string | null;
  teamMembers?: TeamMember[] | null;
};

export type TeamListItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type TeamListGroup = {
  solutionPillar: SolutionPillar;
  teams: TeamListItem[];
};

export const TeamsRepository = {
  async findBySlug(slug: string): Promise<Team | null> {
    const [team] = await db
      .select()
      .from(teamsSchema)
      .where(eq(teamsSchema.slug, slug));
    return team;
  },

  async findAllPublic(): Promise<TeamListGroup[]> {
    const teams = await db
      .select({
        solutionPillar: teamsSchema.solutionPillar,
        teams: sql<TeamListItem[]>`json_agg(
          json_build_object(
            'id', ${teamsSchema.id},
            'name', ${teamsSchema.name},
            'slug', ${teamsSchema.slug},
            'logoUrl', ${teamsSchema.logoUrl}
          )
          order by ${teamsSchema.createdAt} desc
        )`,
      })
      .from(teamsSchema)
      .groupBy(teamsSchema.solutionPillar)
      .orderBy(teamsSchema.solutionPillar);

    return teams;
  },

  async findById(id: string): Promise<Team | null> {
    const [team] = await db
      .select()
      .from(teamsSchema)
      .where(eq(teamsSchema.id, id));

    return team;
  },

  async create(data: NewTeam): Promise<Team> {
    const [team] = await db
      .insert(teamsSchema)
      .values({
        ...data,
      })
      .returning();

    return team;
  },

  async updateLogoUrl(id: string, logoUrl: string): Promise<Team | null> {
    const [team] = await db
      .update(teamsSchema)
      .set({ logoUrl, updatedAt: new Date() })
      .where(eq(teamsSchema.id, id))
      .returning();

    return team ?? null;
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
