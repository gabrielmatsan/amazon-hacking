import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

import { SessionRepository } from "@/auth/infra/session.repository";
import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { teamsSchema } from "@/teams/domain/teams.schema";
import { usersSchema } from "@/users/domain/users.schema";
import type { UserRole } from "@/users/domain/users.type";

import { leaderController } from "./leader.controller";

async function seedUser(role: UserRole = "user", teamId?: string) {
  const email = `${role}-${Date.now()}-${Math.random()}@example.com`;
  const [user] = await db
    .insert(usersSchema)
    .values({
      name: `${role} user`,
      email,
      normalizedEmail: email.toLowerCase(),
      role,
      ...(teamId && { teamId }),
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

describe("Leader controller (integration)", () => {
  const app = new Elysia({ normalize: "typebox" }).use(leaderController);

  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
  });

  describe("requireRole(leader)", () => {
    it("returns 401 when no session is present", async () => {
      const response = await app.handle(
        new Request("http://localhost/leader/teams"),
      );

      expect(response.status).toBe(401);
    });

    it("returns 403 when user has role 'user'", async () => {
      const { sid } = await seedUser("user");

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(403);
    });

    it("returns 403 when user has role 'admin'", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(403);
    });
  });

  describe("POST /leader/teams", () => {
    it("creates a team with status review and links to user", async () => {
      const { user, sid } = await seedUser("leader");

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({
            name: "Minha Equipe",
            description: "Descrição da equipe",
            solutionPillar: "education",
          }),
        }),
      );

      expect(response.status).toBe(201);
      const { data } = await response.json();
      expect(data.name).toBe("Minha Equipe");
      expect(data.status).toBe("review");
      expect(data.slug).toBeString();
      expect(data.rejectionReason).toBeNull();

      const [updatedUser] = await db
        .select()
        .from(usersSchema)
        .where(eq(usersSchema.id, user.id));
      expect(updatedUser.teamId).toBe(data.id);
    });

    it("generates a slug from the team name", async () => {
      const { sid } = await seedUser("leader");

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "Equipe Açaí Norte" }),
        }),
      );

      expect(response.status).toBe(201);
      const { data } = await response.json();
      expect(data.slug).toStartWith("equipe-acai-norte");
    });

    it("returns 409 when leader already has a team", async () => {
      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Existing", slug: "existing-team", status: "active" })
        .returning();
      const { sid } = await seedUser("leader", team.id);

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "Another Team" }),
        }),
      );

      expect(response.status).toBe(409);
    });

    it("returns 422 when name is empty", async () => {
      const { sid } = await seedUser("leader");

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
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
  });

  describe("PUT /leader/teams", () => {
    it("updates the leader's team and sets status to review", async () => {
      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Original", slug: "original-team", status: "active" })
        .returning();
      const { sid } = await seedUser("leader", team.id);

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "Updated Name", description: "New desc" }),
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.name).toBe("Updated Name");
      expect(data.description).toBe("New desc");
      expect(data.status).toBe("review");
    });

    it("clears rejectionReason when leader edits a rejected team", async () => {
      const [team] = await db
        .insert(teamsSchema)
        .values({
          name: "Rejected",
          slug: "rejected-team",
          status: "rejected",
          rejectionReason: "Logo missing",
        })
        .returning();
      const { sid } = await seedUser("leader", team.id);

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ description: "Fixed" }),
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.status).toBe("review");
      expect(data.rejectionReason).toBeNull();
    });

    it("returns 404 when leader has no team", async () => {
      const { sid } = await seedUser("leader");

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ name: "No team" }),
        }),
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /leader/teams", () => {
    it("returns the leader's team regardless of status", async () => {
      const [team] = await db
        .insert(teamsSchema)
        .values({
          name: "My Team",
          slug: "my-team",
          status: "rejected",
          rejectionReason: "Needs improvement",
        })
        .returning();
      const { sid } = await seedUser("leader", team.id);

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.name).toBe("My Team");
      expect(data.status).toBe("rejected");
      expect(data.rejectionReason).toBe("Needs improvement");
    });

    it("returns 404 when leader has no team", async () => {
      const { sid } = await seedUser("leader");

      const response = await app.handle(
        new Request("http://localhost/leader/teams", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /leader/teams/check-slug/:slug", () => {
    it("returns available true when slug does not exist", async () => {
      const { sid } = await seedUser("leader");

      const response = await app.handle(
        new Request("http://localhost/leader/teams/check-slug/new-slug", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.available).toBe(true);
    });

    it("returns available false when slug already exists", async () => {
      const { sid } = await seedUser("leader");
      await db.insert(teamsSchema).values({
        name: "Existing",
        slug: "taken-slug",
        status: "active",
      });

      const response = await app.handle(
        new Request("http://localhost/leader/teams/check-slug/taken-slug", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.available).toBe(false);
    });
  });
});
