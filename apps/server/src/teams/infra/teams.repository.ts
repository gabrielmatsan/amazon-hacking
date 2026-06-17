import { and, eq, sql } from "drizzle-orm";

import { db, type Transaction } from "@/shared/infra/databases/postgres";
import { teamsSchema, type NewTeam } from "../domain/teams.schema";
import type { SolutionPillar, Team, TeamMember } from "../domain/teams.type";

export type UpdateTeamData = {
  name?: string;
  description?: string | null;
  teamMembers?: TeamMember[] | null;
  status?: "active" | "review" | "rejected";
  rejectionReason?: string | null;
  slug?: string;
  solutionPillar?: SolutionPillar;
  logoUrl?: string | null;
  videoUrl?: string | null;
  secondaryVideoUrl?: string | null;
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

export type TeamSearchItem = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  solutionPillar: SolutionPillar;
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
      .where(eq(teamsSchema.status, "active"))
      .groupBy(teamsSchema.solutionPillar)
      .orderBy(teamsSchema.solutionPillar);

    return teams;
  },

  /**
   * Busca textual de teams ativos por relevancia.
   *
   * Motor: Postgres Full-Text Search (config "portuguese" + unaccent) com
   * fallback de trigram (pg_trgm) para tolerar erros de digitacao no nome.
   * Ordenacao: relevancia FTS (ts_rank) > similaridade trigram > mais recente.
   *
   * Depende da coluna gerada `search_vector` e dos indices GIN criados na
   * migration 20260616161714_team_search_engine.
   */
  async search(term: string, limit = 20): Promise<TeamSearchItem[]> {
    const result = await db.execute<TeamSearchItem>(sql`
      SELECT
        ${teamsSchema.id} AS "id",
        ${teamsSchema.name} AS "name",
        ${teamsSchema.slug} AS "slug",
        ${teamsSchema.logoUrl} AS "logoUrl",
        ${teamsSchema.solutionPillar} AS "solutionPillar"
      FROM ${teamsSchema},
        websearch_to_tsquery('portuguese', immutable_unaccent(${term})) AS query
      WHERE ${teamsSchema.status} = 'active'
        AND (
          "teams"."search_vector" @@ query
          OR immutable_unaccent(${teamsSchema.name}) % immutable_unaccent(${term})
        )
      ORDER BY
        ts_rank("teams"."search_vector", query) DESC,
        similarity(immutable_unaccent(${teamsSchema.name}), immutable_unaccent(${term})) DESC,
        ${teamsSchema.createdAt} DESC
      LIMIT ${limit}
    `);

    return result.rows;
  },

  async findBySlugActive(slug: string): Promise<Team | null> {
    const [team] = await db
      .select()
      .from(teamsSchema)
      .where(and(eq(teamsSchema.slug, slug), eq(teamsSchema.status, "active")));
    return team ?? null;
  },

  async findById(id: string): Promise<Team | null> {
    const [team] = await db
      .select()
      .from(teamsSchema)
      .where(eq(teamsSchema.id, id));

    return team;
  },

  async findByIdActive(id: string): Promise<Team | null> {
    const [team] = await db
      .select()
      .from(teamsSchema)
      .where(and(eq(teamsSchema.id, id), eq(teamsSchema.status, "active")));
    return team ?? null;
  },

  async findByStatus(status: "active" | "review" | "rejected"): Promise<Team[]> {
    return db
      .select()
      .from(teamsSchema)
      .where(eq(teamsSchema.status, status))
      .orderBy(teamsSchema.updatedAt);
  },

  async slugExists(slug: string): Promise<boolean> {
    const [team] = await db
      .select({ id: teamsSchema.id })
      .from(teamsSchema)
      .where(eq(teamsSchema.slug, slug))
      .limit(1);
    return !!team;
  },

  async create(data: NewTeam, tx?: Transaction): Promise<Team> {
    const dbInstance = tx ?? db;
    const [team] = await dbInstance
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
    if (data.status !== undefined) values.status = data.status;
    if (data.rejectionReason !== undefined) values.rejectionReason = data.rejectionReason;
    if (data.slug !== undefined) values.slug = data.slug;
    if (data.solutionPillar !== undefined) values.solutionPillar = data.solutionPillar;
    if (data.logoUrl !== undefined) values.logoUrl = data.logoUrl;
    if (data.videoUrl !== undefined) values.videoUrl = data.videoUrl;
    if (data.secondaryVideoUrl !== undefined) values.secondaryVideoUrl = data.secondaryVideoUrl;

    const [team] = await db
      .update(teamsSchema)
      .set(values)
      .where(eq(teamsSchema.id, id))
      .returning();

    return team ?? null;
  },
};
