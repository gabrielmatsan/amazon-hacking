import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { teamsSchema } from "@/teams/domain/teams.schema";

import { teamsController } from "./teams.controller";

describe("Teams controller — public endpoints (integration)", () => {
  const app = new Elysia({ normalize: "typebox" }).use(teamsController);

  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
  });

  it("GET /teams returns { data: [] } when there are no teams", async () => {
    const response = await app.handle(
      new Request("http://localhost/teams")
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: [] });
  });

  it("GET /teams returns teams grouped by solutionPillar", async () => {
    await db.insert(teamsSchema).values({
      name: "Equipe Antiga",
      slug: "equipe-antiga",
      solutionPillar: "education",
      createdAt: new Date("2025-01-01T00:00:00Z"),
    });
    await db.insert(teamsSchema).values({
      name: "Equipe Nova",
      slug: "equipe-nova",
      solutionPillar: "education",
      createdAt: new Date("2025-12-31T00:00:00Z"),
    });

    const response = await app.handle(
      new Request("http://localhost/teams")
    );

    const { data } = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].solutionPillar).toBe("education");
    expect(data[0].teams.map((t: { name: string }) => t.name)).toEqual([
      "Equipe Nova",
      "Equipe Antiga",
    ]);
  });

  it("GET /teams/id/:id returns full team detail including teamMembers", async () => {
    const [created] = await db
      .insert(teamsSchema)
      .values({
        name: "Equipe Beta",
        slug: "equipe-beta",
        description: "Detalhada",
        logoUrl: "https://cdn.example.com/beta.png",
        teamMembers: [{ name: "Maria", role: "designer" }],
      })
      .returning();

    const response = await app.handle(
      new Request(`http://localhost/teams/id/${created.id}`)
    );

    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data).toMatchObject({
      id: created.id,
      name: "Equipe Beta",
      description: "Detalhada",
      logoUrl: "https://cdn.example.com/beta.png",
      teamMembers: [{ name: "Maria", role: "designer" }],
    });
    expect(data.createdAt).toBeString();
  });

  it("GET /teams/slug/:slug returns full team detail by slug", async () => {
    await db.insert(teamsSchema).values({
      name: "Equipe Gamma",
      slug: "equipe-gamma",
      description: "Por slug",
    });

    const response = await app.handle(
      new Request("http://localhost/teams/slug/equipe-gamma")
    );

    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data.name).toBe("Equipe Gamma");
    expect(data.slug).toBe("equipe-gamma");
  });

  it("GET /teams/slug/:slug returns 404 when team does not exist", async () => {
    const response = await app.handle(
      new Request("http://localhost/teams/slug/nonexistent-slug")
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      error: "failed",
      message: "Team not found",
    });
  });

  it("GET /teams returns each team with public fields only (no teamMembers)", async () => {
    await db.insert(teamsSchema).values({
      name: "Equipe Alpha",
      slug: "equipe-alpha",
      description: "A primeira equipe",
      logoUrl: "https://cdn.example.com/alpha.png",
      teamMembers: [{ name: "João", role: "dev" }],
    });

    const response = await app.handle(
      new Request("http://localhost/teams")
    );

    expect(response.status).toBe(200);
    const { data } = await response.json();
    expect(data).toHaveLength(1);
    expect(data[0].solutionPillar).toBe("default");
    expect(data[0].teams).toHaveLength(1);
    expect(data[0].teams[0]).toEqual({
      id: expect.any(String),
      name: "Equipe Alpha",
      slug: "equipe-alpha",
      logoUrl: "https://cdn.example.com/alpha.png",
    });
  });
});
