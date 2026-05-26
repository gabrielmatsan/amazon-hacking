import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";

const mockSendEmail = mock(() => Promise.resolve({ success: true, messageId: "mock-id" }));
mock.module("@/shared/mail/resend/index", () => ({
  resendEmailClient: { sendEmail: mockSendEmail },
  ResendEmailClient: class { sendEmail = mockSendEmail },
}));

import { SessionRepository } from "@/auth/infra/session.repository";
import { appConfigSchema } from "@/config/domain/config.schema";
import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { teamsSchema } from "@/teams/domain/teams.schema";
import { usersSchema } from "@/users/domain/users.schema";
import type { UserRole } from "@/users/domain/users.type";
import { votesSchema } from "@/votes/domain/votes.schema";

import { adminController } from "./admin.controller";

async function seedUser(role: UserRole = "user") {
  const email = `${role}-${Date.now()}-${Math.random()}@example.com`;
  const [user] = await db
    .insert(usersSchema)
    .values({
      name: `${role} user`,
      email,
      normalizedEmail: email.toLowerCase(),
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
    mockSendEmail.mockClear();
  });

  describe("requireAdmin", () => {
    it("returns 401 when no token is present", async () => {
      const response = await app.handle(
        new Request("http://localhost/admin/teams", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "Equipe X", slug: "equipe-x" }),
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
          body: JSON.stringify({ name: "Equipe X", slug: "equipe-x" }),
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
          body: JSON.stringify({ name: "Equipe X", slug: "equipe-x" }),
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
            slug: "equipe-alpha",
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
          body: JSON.stringify({ name: "Equipe Mínima", slug: "equipe-minima" }),
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
          body: JSON.stringify({ name: "", slug: "empty-name" }),
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
            slug: "equipe-quebrada",
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
            slug: "equipe-com-logo",
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
        .values({ name: "Original", slug: "test-team-original", description: "antigo" })
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
        .values({ name: "Original", slug: "test-team-preserva", description: "preserva" })
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
        .values({ name: "Original", slug: "test-team-logo", logoUrl: "https://cdn.example.com/original.png" })
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
        .values({ name: "Original", slug: "test-team-forbidden" })
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
          body: JSON.stringify({ name: "Pós-promoção", slug: "pos-promocao" }),
        }),
      );

      expect(response.status).toBe(201);
    });
  });

  describe("GET /admin/teams/review", () => {
    it("returns only teams with review status", async () => {
      const { sid } = await seedUser("admin");

      await db.insert(teamsSchema).values([
        { name: "Active Team", slug: "active-team", status: "active" },
        { name: "Review Team", slug: "review-team", status: "review" },
        { name: "Rejected Team", slug: "rejected-team", status: "rejected" },
      ]);

      const response = await app.handle(
        new Request("http://localhost/admin/teams/review", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data).toHaveLength(1);
      expect(data[0].name).toBe("Review Team");
      expect(data[0].status).toBe("review");
    });

    it("returns empty array when no teams in review", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/teams/review", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data).toEqual([]);
    });
  });

  describe("PUT /admin/teams/:id/approve", () => {
    it("approves a team in review and sets status to active", async () => {
      const { sid } = await seedUser("admin");
      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Pending", slug: "pending-team", status: "review" })
        .returning();

      const response = await app.handle(
        new Request(`http://localhost/admin/teams/${team.id}/approve`, {
          method: "PUT",
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.status).toBe("active");
      expect(data.rejectionReason).toBeNull();
    });

    it("clears rejectionReason when approving a rejected team", async () => {
      const { sid } = await seedUser("admin");
      const [team] = await db
        .insert(teamsSchema)
        .values({
          name: "Rejected",
          slug: "rejected-team",
          status: "rejected",
          rejectionReason: "old reason",
        })
        .returning();

      const response = await app.handle(
        new Request(`http://localhost/admin/teams/${team.id}/approve`, {
          method: "PUT",
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.status).toBe("active");
      expect(data.rejectionReason).toBeNull();
    });

    it("returns 404 for non-existent team", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/teams/nonexistent-id/approve", {
          method: "PUT",
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /admin/teams/:id/reject", () => {
    it("rejects a team and stores the reason", async () => {
      const { sid } = await seedUser("admin");
      const [leader] = await db
        .insert(usersSchema)
        .values({
          name: "Leader",
          email: "leader@example.com",
          normalizedEmail: "leader@example.com",
          role: "leader",
        })
        .returning();

      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Under Review", slug: "under-review", status: "review" })
        .returning();

      await db
        .update(usersSchema)
        .set({ teamId: team.id })
        .where(eq(usersSchema.id, leader.id));

      const response = await app.handle(
        new Request(`http://localhost/admin/teams/${team.id}/reject`, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ reason: "Logo is missing" }),
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.status).toBe("rejected");
      expect(data.rejectionReason).toBe("Logo is missing");
    });

    it("returns 404 for non-existent team", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/teams/nonexistent-id/reject", {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ reason: "Bad" }),
        }),
      );

      expect(response.status).toBe(404);
    });

    it("returns 422 when reason is empty", async () => {
      const { sid } = await seedUser("admin");
      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Team", slug: "team-empty-reason", status: "review" })
        .returning();

      const response = await app.handle(
        new Request(`http://localhost/admin/teams/${team.id}/reject`, {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({ reason: "" }),
        }),
      );

      expect(response.status).toBe(422);
    });
  });

  describe("GET /admin/config", () => {
    it("returns default config when no config exists", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/config", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.votingEnabled).toBe(true);
      expect(data.votingStartsAt).toBeNull();
      expect(data.votingEndsAt).toBeNull();
    });
  });

  describe("PUT /admin/config", () => {
    it("creates config when none exists", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/config", {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({
            votingStartsAt: "2026-06-01T08:00:00.000Z",
            votingEndsAt: "2026-06-01T18:00:00.000Z",
            votingEnabled: true,
            maxRiskScore: 33,
          }),
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.votingEnabled).toBe(true);
      expect(data.votingStartsAt).toBeTruthy();
      expect(data.votingEndsAt).toBeTruthy();
      expect(data.id).toBeString();
    });

    it("updates existing config", async () => {
      const { sid } = await seedUser("admin");

      await db.insert(appConfigSchema).values({
        votingEnabled: true,
        votingStartsAt: new Date("2026-06-01T08:00:00Z"),
        votingEndsAt: new Date("2026-06-01T18:00:00Z"),
      });

      const response = await app.handle(
        new Request("http://localhost/admin/config", {
          method: "PUT",
          headers: {
            "content-type": "application/json",
            cookie: authCookie(sid),
          },
          body: JSON.stringify({
            votingStartsAt: null,
            votingEndsAt: null,
            votingEnabled: false,
            maxRiskScore: 50,
          }),
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.votingEnabled).toBe(false);
      expect(data.votingStartsAt).toBeNull();
      expect(data.votingEndsAt).toBeNull();
    });
  });

  describe("GET /admin/votes/flagged", () => {
    it("returns flagged votes with cursor pagination", async () => {
      const { sid } = await seedUser("admin");

      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Team", slug: "team-flagged", status: "active" })
        .returning();

      const emails = Array.from({ length: 3 }, (_, i) => `flagged-${Date.now()}-${i}@example.com`);
      const voters = await db
        .insert(usersSchema)
        .values(emails.map((email, i) => ({
          name: `Voter ${i}`,
          email,
          normalizedEmail: email.toLowerCase(),
        })))
        .returning();

      await db.insert(votesSchema).values([
        { userId: voters[0].id, teamId: team.id, status: "flagged", phoneNumber: "+5511900010001" },
        { userId: voters[1].id, teamId: team.id, status: "flagged", phoneNumber: "+5511900010002" },
        { userId: voters[2].id, teamId: team.id, status: "valid", phoneNumber: "+5511900010003" },
      ]);

      const response = await app.handle(
        new Request("http://localhost/admin/votes/flagged?limit=10", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.items).toHaveLength(2);
      expect(data.items.every((v: { status: string }) => v.status === "flagged")).toBe(true);
    });

    it("returns empty when no flagged votes", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/votes/flagged", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.items).toHaveLength(0);
      expect(data.nextCursor).toBeNull();
    });

    it("paginates with cursor", async () => {
      const { sid } = await seedUser("admin");

      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Team", slug: "team-cursor", status: "active" })
        .returning();

      const emails = Array.from({ length: 3 }, (_, i) => `cursor-${Date.now()}-${i}@example.com`);
      const voters = await db
        .insert(usersSchema)
        .values(emails.map((email, i) => ({
          name: `Voter ${i}`,
          email,
          normalizedEmail: email.toLowerCase(),
        })))
        .returning();

      await db.insert(votesSchema).values([
        { userId: voters[0].id, teamId: team.id, status: "flagged", phoneNumber: "+5511900020001", createdAt: new Date("2026-01-01T01:00:00Z") },
        { userId: voters[1].id, teamId: team.id, status: "flagged", phoneNumber: "+5511900020002", createdAt: new Date("2026-01-01T02:00:00Z") },
        { userId: voters[2].id, teamId: team.id, status: "flagged", phoneNumber: "+5511900020003", createdAt: new Date("2026-01-01T03:00:00Z") },
      ]);

      const firstPage = await app.handle(
        new Request("http://localhost/admin/votes/flagged?limit=2", {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(firstPage.status).toBe(200);
      const first = await firstPage.json();
      expect(first.data.items).toHaveLength(2);
      expect(first.data.nextCursor).toBeString();

      const secondPage = await app.handle(
        new Request(`http://localhost/admin/votes/flagged?limit=2&cursor=${first.data.nextCursor}`, {
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(secondPage.status).toBe(200);
      const second = await secondPage.json();
      expect(second.data.items).toHaveLength(1);
      expect(second.data.nextCursor).toBeNull();
    });
  });

  describe("PUT /admin/votes/:id/approve", () => {
    it("changes flagged vote status to valid", async () => {
      const { sid } = await seedUser("admin");

      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Team", slug: "team-vote-approve", status: "active" })
        .returning();

      const [voter] = await db
        .insert(usersSchema)
        .values({ name: "Voter", email: `approve-${Date.now()}@example.com`, normalizedEmail: `approve-${Date.now()}@example.com` })
        .returning();

      const [vote] = await db
        .insert(votesSchema)
        .values({ userId: voter.id, teamId: team.id, status: "flagged", phoneNumber: "+5511900030001" })
        .returning();

      const response = await app.handle(
        new Request(`http://localhost/admin/votes/${vote.id}/approve`, {
          method: "PUT",
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.status).toBe("valid");
    });

    it("returns 404 for non-existent vote", async () => {
      const { sid } = await seedUser("admin");

      const response = await app.handle(
        new Request("http://localhost/admin/votes/nonexistent-id/approve", {
          method: "PUT",
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(404);
    });
  });

  describe("PUT /admin/votes/:id/invalidate", () => {
    it("changes flagged vote status to invalidated", async () => {
      const { sid } = await seedUser("admin");

      const [team] = await db
        .insert(teamsSchema)
        .values({ name: "Team", slug: "team-vote-invalidate", status: "active" })
        .returning();

      const [voter] = await db
        .insert(usersSchema)
        .values({ name: "Voter", email: `invalidate-${Date.now()}@example.com`, normalizedEmail: `invalidate-${Date.now()}@example.com` })
        .returning();

      const [vote] = await db
        .insert(votesSchema)
        .values({ userId: voter.id, teamId: team.id, status: "flagged", phoneNumber: "+5511900040001" })
        .returning();

      const response = await app.handle(
        new Request(`http://localhost/admin/votes/${vote.id}/invalidate`, {
          method: "PUT",
          headers: { cookie: authCookie(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const { data } = await response.json();
      expect(data.status).toBe("invalidated");
    });
  });

  describe("GET /admin/votes/count", () => {
    it("returns valid votes count grouped by team for admin users", async () => {
      const { sid } = await seedUser("admin");

      const [firstTeam, secondTeam] = await db
        .insert(teamsSchema)
        .values([
          { name: "Equipe Alpha", slug: "equipe-alpha-votes", status: "active" },
          { name: "Equipe Beta", slug: "equipe-beta-votes", status: "active" },
        ])
        .returning();

      const voterEmails = Array.from({ length: 4 }, () => IntegrationTestHelper.generateTestEmail());
      const users = await db
        .insert(usersSchema)
        .values(voterEmails.map((email, i) => ({
          name: `Voter ${i + 1}`,
          email,
          normalizedEmail: email.toLowerCase(),
        })))
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
