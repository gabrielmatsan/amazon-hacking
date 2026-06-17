import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { teamsSchema } from "@/teams/domain/teams.schema";
import type { NewTeam } from "@/teams/domain/teams.schema";

import { teamsController } from "./teams.controller";

const app = new Elysia({ normalize: "typebox" }).use(teamsController);

async function seedTeam(values: Partial<NewTeam> & { name: string; slug: string }) {
  await db.insert(teamsSchema).values({
    status: "active",
    ...values,
  });
}

async function search(q: string): Promise<{ name: string; slug: string; solutionPillar: string }[]> {
  const response = await app.handle(
    new Request(`http://localhost/teams/search?q=${encodeURIComponent(q)}`)
  );
  expect(response.status).toBe(200);
  const { data } = await response.json();
  return data;
}

describe("GET /teams/search — FTS + trigram search engine (integration)", () => {
  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
  });

  it("matches a team by NAME (full-text search)", async () => {
    await seedTeam({
      name: "Agro Inteligente",
      slug: "agro-inteligente",
      solutionPillar: "digital_agriculture",
    });

    const results = await search("agro");

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: "Agro Inteligente",
      slug: "agro-inteligente",
      solutionPillar: "digital_agriculture",
    });
  });

  it("matches a team by DESCRIPTION (full-text search)", async () => {
    await seedTeam({
      name: "Time Floresta",
      slug: "time-floresta",
      description: "Plataforma de telemedicina para comunidades ribeirinhas",
    });

    const results = await search("telemedicina");

    expect(results.map((t) => t.name)).toEqual(["Time Floresta"]);
  });

  it("bridges morphological families via prefix matching ('educação' finds 'educativo')", async () => {
    await seedTeam({
      name: "Projeto Saber",
      slug: "projeto-saber",
      description: "Jogo educativo para escolas ribeirinhas",
      solutionPillar: "education",
    });

    const results = await search("educação");

    expect(results.map((t) => t.name)).toEqual(["Projeto Saber"]);
  });

  it("bridges plural/flexion the stemmer splits differently ('rural' finds 'rurais')", async () => {
    await seedTeam({
      name: "Conectividade Rurais",
      slug: "conectividade-rurais",
      description: "Internet para comunidades",
      solutionPillar: "logistics",
    });

    const results = await search("rural");

    expect(results.map((t) => t.name)).toEqual(["Conectividade Rurais"]);
  });

  it("is ACCENT-insensitive (unaccent)", async () => {
    await seedTeam({ name: "Saúde Digital", slug: "saude-digital" });

    const results = await search("saude");

    expect(results.map((t) => t.name)).toEqual(["Saúde Digital"]);
  });

  it("RANKS name matches above description-only matches", async () => {
    await seedTeam({
      name: "Rota Norte",
      slug: "rota-norte",
      description: "Mobilidade urbana",
    });
    await seedTeam({
      name: "Conecta",
      slug: "conecta",
      description: "Otimiza a rota fluvial dos barcos",
    });

    const results = await search("rota");

    // "Rota Norte" tem o termo no nome (peso A) e deve vir antes de "Conecta"
    // (termo so na descricao, peso B).
    expect(results.map((t) => t.name)).toEqual(["Rota Norte", "Conecta"]);
  });

  it("tolerates TYPOS via trigram fallback (pg_trgm)", async () => {
    await seedTeam({ name: "Zenturia", slug: "zenturia" });

    // "zenturai" — transposicao de letras; nao casa no FTS, casa no trigram.
    const results = await search("zenturai");

    expect(results.map((t) => t.name)).toEqual(["Zenturia"]);
  });

  it("excludes teams that are NOT active", async () => {
    await seedTeam({ name: "Equipe Oculta", slug: "equipe-oculta", status: "review" });
    await seedTeam({ name: "Equipe Rejeitada", slug: "equipe-rejeitada", status: "rejected" });

    const results = await search("equipe");

    expect(results).toEqual([]);
  });

  it("returns an empty list for a term shorter than 2 chars", async () => {
    await seedTeam({ name: "Agro Inteligente", slug: "agro-inteligente" });

    const results = await search("a");

    expect(results).toEqual([]);
  });

  it("returns an empty list when nothing matches", async () => {
    await seedTeam({ name: "Agro Inteligente", slug: "agro-inteligente" });

    const results = await search("xyzqwk");

    expect(results).toEqual([]);
  });
});
