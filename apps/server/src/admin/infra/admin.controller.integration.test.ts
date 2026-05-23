import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { SessionRepository } from "@/auth/infra/session.repository";
import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { teamsSchema } from "@/teams/domain/teams.schema";
import { usersSchema } from "@/users/domain/users.schema";
import type { UserRole } from "@/users/domain/users.type";
import { votesSchema } from "@/votes/domain/votes.schema";

import { adminController } from "./admin.controller";

async function seedUser(role: UserRole = "user") {
  const [user] = await db
    .insert(usersSchema)
    .values({
      name: `${role} user`,
      email: `${role}-${Date.now()}-${Math.random()}@example.com`,
      role,
    })
    .returning();

  const sid = await SessionRepository.create({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, sid };
}

const authCookie = (sid: string) => `session_id=${sid}`;

describe("Admin teams controller (integration)", () => {
  const app = new Elysia({ normalize: "typebox" }).use(adminController);

  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
  });

  describe("requireAdmin", () => {
    it("returns 401 when no token is present", async () => {
      const response = await app.handle(
        new Request("http://localhost/admin/teams", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "Equipe X" }),
        }),
      );

      expect(response.status).toBe(401);
    });

    it("returns 403 when authenticated user has role 'user'", async () => {
      const { sid } = await seedUser("user");

      const response = await app.handle(
        new Request("http://localhost/admin/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "Equipe X" }),
        }),
      );

      expect(response.status).toBe(403);
    });

    it("returns 403 when authenticated user has role 'mentor'", async () => {
      const { sid } = await seedUser("mentor");

      const response = await app.handle(
        new Request("http://localhost/admin/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "Equipe X" }),
        }),
      );

      expect(response.status).toBe(403);
    });
  });

  describe("POST /admin/teams", () => {
    it("creates a team and returns 201 with the entity", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({
            name: "Equipe Alpha",
            description: "A primeira equipe",
            teamMembers: [{ name: "João", role: "dev" }],
          }),
        }),
      );

      expect(response.status).toBe(201);
      const { data } = await response.json();
      expect(data).toMatchObject({
        name: "Equipe Alpha",
        description: "A primeira equipe",
        logoUrl: null,
        teamMembers: [{ name: "João", role: "dev" }],
      });
      expect(data.id).toBeString();
    });

    it("creates a team with only name (description and teamMembers optional)", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "Equipe Mínima" }),
        }),
      );

      expect(response.status).toBe(201);
      const { data } = await response.json();
      expect(data.name).toBe("Equipe Mínima");
      expect(data.description).toBeNull();
      expect(data.teamMembers).toBeNull();
    });

    it("rejects empty name with 422", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "" }),
        }),
      );

      expect(response.status).toBe(422);
    });

    it("rejects teamMember without role with 422", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({
            name: "Equipe Quebrada",
            teamMembers: [{ name: "Sem role" }],
          }),
        }),
      );

      expect(response.status).toBe(422);
    });

    it("ignores logoUrl in body (logoUrl vem do slice de upload, não persiste)", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({
            name: "Equipe Com Logo",
            logoUrl: "https://cdn.example.com/logo.png",
          }),
        }),
      );

      expect(response.status).toBe(201);
      const { data } = await response.json();
      expect(data.logoUrl).toBeNull();
    });
  });

  describe("PUT /admin/teams/:id", () => {
    it("updates an existing team and returns 200", async () => {
      const { sid } = await seedUser("admin");
      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Original", description: "antigo" })
        .returning();

      const response = await app.handle(
        new Request(`http://localhost/admin/teams/${team.id}`, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({
            name: "Atualizada",
            description: "novo",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data).toMatchObject({
        id: team.id,
        name: "Atualizada",
        description: "novo",
      });
    });

    it("accepts partial updates (only name)", async () => {
      const { sid } = await seedUser("admin");
      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Original", description: "preserva" })
        .returning();

      const response = await app.handle(
        new Request(`http://localhost/admin/teams/${team.id}`, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "Só nome" }),
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.name).toBe("Só nome");
      expect(data.description).toBe("preserva");
    });

    it("returns 404 when team does not exist", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/teams/nonexistent-id", {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "X" }),
        }),
      );

      expect(response.status).toBe(404);
    });

    it("ignores logoUrl in body and preserves existing logo_url in DB", async () => {
      const { sid } = await seedUser("admin");
      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Original", logoUrl: "https://cdn.example.com/original.png" })
        .returning();

      const response = await app.handle(
        new Request(`http://localhost/admin/teams/${team.id}`, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({
            name: "Atualizado",
            logoUrl: "https://x.com/y.png",
          }),
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.name).toBe("Atualizado");
      expect(data.logoUrl).toBe("https://cdn.example.com/original.png");
    });

    it("returns 403 for non-admin user trying to edit", async () => {
      const { sid } = await seedUser("user");
      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Original" })
        .returning();

      const response = await app.handle(
        new Request(`http://localhost/admin/teams/${team.id}`, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "Tentando" }),
        }),
      );

      expect(response.status).toBe(403);
    });
  });

  describe("admin promoted via SQL", () => {
    it("user promoted to admin via SQL UPDATE can create teams", async () => {
      const { user } = await seedUser("user");

      await db
        .update(usersSchema)
        .set({ role: "admin" })
        .where(eq(usersSchema.id, user.id));

      const newSid = await SessionRepository.create({
        id: user.id,
        email: user.email,
        role: "admin",
      });

      const response = await app.handle(
        new Request("http://localhost/admin/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(newSid),
          },
          body: JSON.stringify({ name: "Pós-promoção" }),
        }),
      );

      expect(response.status).toBe(201);
    });
  });

  describe("GET /admin/votes/count", () => {
    it("returns valid votes count grouped by team for admin users", async () => {
      const { sid } = await seedUser("admin");

      const [firstTeam, secondTeam] = await db
        .insert(teamsSchema)
        .values([
          { name: "Equipe Alpha" },
          { name: "Equipe Beta" },
        ])
        .returning();

      const users = await db
        .insert(usersSchema)
        .values([
          { name: "Voter 1", email: IntegrationTestHelper.generateTestEmail() },
          { name: "Voter 2", email: IntegrationTestHelper.generateTestEmail() },
          { name: "Voter 3", email: IntegrationTestHelper.generateTestEmail() },
          { name: "Voter 4", email: IntegrationTestHelper.generateTestEmail() },
        ])
        .returning();

      await db.insert(votesSchema).values([
        { userId: users[0].id, teamId: firstTeam.id, status: "valid", phoneNumber: "+5511900000001" },
        { userId: users[1].id, teamId: firstTeam.id, status: "valid", phoneNumber: "+5511900000002" },
        { userId: users[2].id, teamId: secondTeam.id, status: "valid", phoneNumber: "+5511900000003" },
        { userId: users[3].id, teamId: secondTeam.id, status: "invalidated", phoneNumber: "+5511900000004" },
      ]);

      const response = await app.handle(
        new Request("http://localhost/admin/votes/count", {
          method: "GET",
          headers: {
            cookie: authCookie(sid),
          },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();

      expect(
        data.toSorted((a: { teamName: string }, b: { teamName: string }) =>
          a.teamName.localeCompare(b.teamName),
        ),
      ).toEqual([
        {
          teamId: firstTeam.id,
          teamName: "Equipe Alpha",
          votesCount: 2,
        },
        {
          teamId: secondTeam.id,
          teamName: "Equipe Beta",
          votesCount: 1,
        },
      ]);
    });
  });
});
