import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

import { db } from "@/shared/infra/databases/postgres";
import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { MessageSendError } from "@/shared/infra/messaging";
import { setMessageSenderForTests } from "@/shared/infra/messaging";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { usersSchema } from "@/users/domain/users.schema";
import { votesTokensSchema } from "@/votes-token/domain/votes-tokens.schema";
import { votesSchema } from "@/votes/domain/votes.schema";
import { teamsSchema } from "@/teams/domain/teams.schema";

import { createVoteTokenUseCase } from "./create-vote-token.usecase";

const mockSendEmail = mock(() => Promise.resolve({ success: true }));

mock.module("@/shared/mail/resend", () => ({
  resendEmailClient: { sendEmail: mockSendEmail },
}));

describe("createVoteTokenUseCase (integration)", () => {
  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
    mockSendEmail.mockClear();
  });

  async function seedUser(name = "Test User") {
    const [user] = await db
      .insert(usersSchema)
      .values({
        name,
        email: IntegrationTestHelper.generateTestEmail(),
      })
      .returning();
    return user;
  }

  it("creates a token via whatsapp when sender succeeds", async () => {
    setMessageSenderForTests({
      send: mock(() => Promise.resolve()),
    });

    const user = await seedUser();

    const result = await createVoteTokenUseCase(user.id, {
      phoneNumber: "+5591988887777",
    });

    expect(result.channel).toBe("whatsapp");
    expect(result.message).toBe("Verification code sent");
    expect(result.expiresAt).toBeInstanceOf(Date);

    const tokens = await db.select().from(votesTokensSchema);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].channel).toBe("whatsapp");
    expect(tokens[0].phoneNumber).toBe("+5591988887777");
  });

  it("falls back to email when whatsapp sender throws MessageSendError", async () => {
    setMessageSenderForTests({
      send: mock(() => {
        throw new MessageSendError("WhatsApp API down");
      }),
    });

    const user = await seedUser("Fallback User");

    const result = await createVoteTokenUseCase(user.id, {
      phoneNumber: "+5591988886666",
    });

    expect(result.channel).toBe("email");

    const tokens = await db.select().from(votesTokensSchema);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].channel).toBe("email");
    expect(tokens[0].phoneNumber).toBeNull();

    expect(mockSendEmail).toHaveBeenCalledTimes(2);

    const calls = mockSendEmail.mock.calls as unknown as Array<[{ to: string | string[]; subject: string; template: string }]>;
    const userEmailCall = calls.find((c) => c[0].to === user.email);
    expect(userEmailCall).toBeTruthy();

    const adminEmailCall = calls.find(
      (c) => Array.isArray(c[0].to) && c[0].to.includes("ryan@tucupy.com"),
    );
    expect(adminEmailCall).toBeTruthy();
  });

  it("falls back to email when whatsapp sender throws unexpected error", async () => {
    setMessageSenderForTests({
      send: mock(() => {
        throw new Error("Connection refused");
      }),
    });

    const user = await seedUser();

    const result = await createVoteTokenUseCase(user.id, {
      phoneNumber: "+5591988885555",
    });

    expect(result.channel).toBe("email");

    const tokens = await db.select().from(votesTokensSchema);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].channel).toBe("email");
    expect(tokens[0].phoneNumber).toBeNull();
  });

  it("rejects when user already voted", async () => {
    setMessageSenderForTests({
      send: mock(() => Promise.resolve()),
    });

    const user = await seedUser();
    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team A", slug: "team-a" })
      .returning();

    await db.insert(votesSchema).values({
      userId: user.id,
      teamId: team.id,
      phoneNumber: "+5591900001111",
      channel: "whatsapp",
      status: "valid",
    });

    await expect(
      createVoteTokenUseCase(user.id, { phoneNumber: "+5591988884444" }),
    ).rejects.toThrow(ConflictError);
  });

  it("rejects when phone number is already used by another vote", async () => {
    setMessageSenderForTests({
      send: mock(() => Promise.resolve()),
    });

    const user1 = await seedUser("User 1");
    const user2 = await seedUser("User 2");
    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team B", slug: "team-b" })
      .returning();

    const phone = "+5591900002222";
    await db.insert(votesSchema).values({
      userId: user1.id,
      teamId: team.id,
      phoneNumber: phone,
      channel: "whatsapp",
      status: "valid",
    });

    await expect(
      createVoteTokenUseCase(user2.id, { phoneNumber: phone }),
    ).rejects.toThrow(ConflictError);
  });
});
