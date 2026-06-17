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
   * Motor (duas camadas, OR):
   *  1. Full-Text Search ("portuguese" + unaccent) com PREFIX MATCHING — cada
   *     lexema do termo vira prefixo de stem, bom para match exato, stemming e
   *     autocomplete; alimenta o ranking principal (ts_rank).
   *  2. Trigram ANCORADO NA RAIZ — rede de seguranca para o que o FTS perde
   *     (plural/flexao que o stemmer corta diferente, ex: "rural"->"rurais", e
   *     familia morfologica que o prefixo de stem nao alcanca, ex: "educacao"
   *     achando "educativo"). Para nao trazer ruido (palavras que so colidem em
   *     trigramas, ex: "educacao" ~ "Porto Digital"), exige DUAS condicoes:
   *       a) word_similarity >= TRIGRAM_THRESHOLD (recall fuzzy), E
   *       b) o texto conter os ROOT_ANCHOR_LEN primeiros chars do termo
   *          (a raiz compartilhada — separa "educativo" real de colisao).
   *     Os valores foram calibrados com dados reais: a familia educ- e os
   *     plurais -al/-ais ficam acima de 0.5 e compartilham a raiz; o ruido
   *     "-cao" (dedicacao, producao...) fica em 0.44 e nao compartilha a raiz.
   *
   * Ordenacao: relevancia FTS > similaridade trigram > mais recente.
   *
   * Depende da coluna gerada `search_vector` e dos indices GIN criados na
   * migration 20260616161714_team_search_engine. O trigram/anchor sobre a
   * descricao roda sem indice dedicado (seq scan) — irrelevante no volume atual.
   */
  async search(term: string, limit = 20): Promise<TeamSearchItem[]> {
    const TRIGRAM_THRESHOLD = 0.5;
    const ROOT_ANCHOR_LEN = 4;

    const result = await db.execute<TeamSearchItem>(sql`
      SELECT
        ${teamsSchema.id} AS "id",
        ${teamsSchema.name} AS "name",
        ${teamsSchema.slug} AS "slug",
        ${teamsSchema.logoUrl} AS "logoUrl",
        ${teamsSchema.solutionPillar} AS "solutionPillar"
      FROM ${teamsSchema},
        to_tsquery('portuguese', (
          SELECT string_agg(lexeme || ':*', ' & ')
          FROM unnest(to_tsvector('portuguese', immutable_unaccent(${term})))
        )) AS query
      WHERE ${teamsSchema.status} = 'active'
        AND (
          "teams"."search_vector" @@ query
          OR (
            word_similarity(
              immutable_unaccent(${term}),
              immutable_unaccent(${teamsSchema.name} || ' ' || coalesce(${teamsSchema.description}, ''))
            ) >= ${TRIGRAM_THRESHOLD}
            AND immutable_unaccent(${teamsSchema.name} || ' ' || coalesce(${teamsSchema.description}, ''))
              ILIKE '%' || left(immutable_unaccent(${term}), ${ROOT_ANCHOR_LEN}) || '%'
          )
        )
      ORDER BY
        ts_rank("teams"."search_vector", query) DESC,
        word_similarity(
          immutable_unaccent(${term}),
          immutable_unaccent(${teamsSchema.name} || ' ' || coalesce(${teamsSchema.description}, ''))
        ) DESC,
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
