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

import { normalizeEmail } from "@/shared/utils/normalize-email";
import { createVoteTokenUseCase } from "./create-vote-token.usecase";

const mockSendEmail = mock(() => Promise.resolve({ success: true }));

mock.module("@/shared/mail/resend", () => ({
  resendEmailClient: { sendEmail: mockSendEmail },
}));

mock.module("@/shared/infra/proxy-api/proxy-api-client", () => ({
  proxyApiClient: {
    assessRisk: mock(() => Promise.resolve(null)),
    checkIp: mock(() => Promise.resolve(null)),
    checkBatch: mock(() => Promise.resolve(new Map())),
  },
}));

mock.module("@/shared/infra/turnstile/verify-turnstile", () => ({
  verifyTurnstileToken: mock(() => Promise.resolve()),
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
    const email = IntegrationTestHelper.generateTestEmail();
    const [user] = await db
      .insert(usersSchema)
      .values({
        name,
        email,
        normalizedEmail: normalizeEmail(email),
      })
      .returning();
    return user;
  }

  it("creates a token via whatsapp when sender succeeds", async () => {
    setMessageSenderForTests({
      send: mock(() => Promise.resolve({ channel: "whatsapp" as const })),
    });

    const user = await seedUser();

    const result = await createVoteTokenUseCase(user.id, {
      phoneNumber: "+5591988887777",
      turnstileToken: "test-token",
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
      turnstileToken: "test-token",
    });

    expect(result.channel).toBe("email");

    const tokens = await db.select().from(votesTokensSchema);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].channel).toBe("email");
    expect(tokens[0].phoneNumber).toBeNull();

    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    const calls = mockSendEmail.mock.calls as unknown as Array<[{ to: string | string[]; subject: string; template: string }]>;
    const userEmailCall = calls.find((c) => c[0].to === user.email);
    expect(userEmailCall).toBeTruthy();
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
      turnstileToken: "test-token",
    });

    expect(result.channel).toBe("email");

    const tokens = await db.select().from(votesTokensSchema);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].channel).toBe("email");
    expect(tokens[0].phoneNumber).toBeNull();
  });

  it("rejects when user already voted", async () => {
    setMessageSenderForTests({
      send: mock(() => Promise.resolve({ channel: "whatsapp" as const })),
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
      createVoteTokenUseCase(user.id, { phoneNumber: "+5591988884444", turnstileToken: "test-token" }),
    ).rejects.toThrow(ConflictError);
  });

  it("rejects when phone number is already used by another vote", async () => {
    setMessageSenderForTests({
      send: mock(() => Promise.resolve({ channel: "whatsapp" as const })),
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
      createVoteTokenUseCase(user2.id, { phoneNumber: phone, turnstileToken: "test-token" }),
    ).rejects.toThrow(ConflictError);
  });
});
