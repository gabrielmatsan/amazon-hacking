import { createHash } from "crypto";

import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

import { db } from "@/shared/infra/databases/postgres";
import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { MessageSendError, setMessageSenderForTests } from "@/shared/infra/messaging";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { teamsSchema } from "@/teams/domain/teams.schema";
import { usersSchema } from "@/users/domain/users.schema";
import { createVoteTokenUseCase } from "@/votes-token/application/create-vote-token.usecase";
import { votesTokensSchema } from "@/votes-token/domain/votes-tokens.schema";

import type { resendEmailClient } from "@/shared/mail/resend";
import { votesSchema } from "../domain/votes.schema";
import { voteForTimeByIdUseCase } from "./vote-for-time-by-id.usecase";

mock.module("@/shared/mail/resend/index", () => ({
  resendEmailClient: {
    sendEmail: mock(() => Promise.resolve({ success: true })),
  },
}));

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function seedToken(
  userId: string,
  phoneNumber: string | null,
  code: string,
  channel: "whatsapp" | "email" = "whatsapp",
) {
  await db.insert(votesTokensSchema).values({
    userId,
    phoneNumber,
    channel,
    tokenHash: sha256(code),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
}

describe("voteForTimeByIdUseCase", () => {
  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
  });

  it("creates a vote via whatsapp with phone number", async () => {
    const [user] = await db
      .insert(usersSchema)
      .values({
        name: "Maria",
        email: IntegrationTestHelper.generateTestEmail(),
      })
      .returning();

    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Alpha", slug: "test-team-1" })
      .returning();

    const phone = "+5511900000010";
    const code = "123456";
    await seedToken(user.id, phone, code, "whatsapp");

    const result = await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: team.id,
      token: code,
    });

    expect(result.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].phoneNumber).toBe(phone);
    expect(votes[0].channel).toBe("whatsapp");
  });

  it("creates a vote via email fallback with null phone number", async () => {
    const [user] = await db
      .insert(usersSchema)
      .values({
        name: "Carlos",
        email: IntegrationTestHelper.generateTestEmail(),
      })
      .returning();

    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Gamma", slug: "test-team-email" })
      .returning();

    const code = "654321";
    await seedToken(user.id, null, code, "email");

    const result = await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: team.id,
      token: code,
    });

    expect(result.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].phoneNumber).toBeNull();
    expect(votes[0].channel).toBe("email");
  });

  it("rejects a wrong token and increments attempts", async () => {
    const [user] = await db
      .insert(usersSchema)
      .values({
        name: "Joao",
        email: IntegrationTestHelper.generateTestEmail(),
      })
      .returning();

    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Beta", slug: "test-team-2" })
      .returning();

    const phone = "+5511900000011";
    await seedToken(user.id, phone, "999999");

    await expect(
      voteForTimeByIdUseCase({
        userId: user.id,
        teamId: team.id,
        token: "111111",
      }),
    ).rejects.toThrow(UnauthorizedError);

    const tokens = await db.select().from(votesTokensSchema);
    expect(tokens).toHaveLength(1);
    expect(tokens[0].attempts).toBe(1);
  });

  it("does not allow the same user to vote twice", async () => {
    const [user] = await db
      .insert(usersSchema)
      .values({
        name: "Maria",
        email: IntegrationTestHelper.generateTestEmail(),
      })
      .returning();

    const [firstTeam] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Alpha", slug: "test-team-3" })
      .returning();

    const [secondTeam] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Beta", slug: "test-team-4" })
      .returning();

    const phone = "+5511900000012";
    const code = "555555";
    await seedToken(user.id, phone, code);

    await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: firstTeam.id,
      token: code,
    });

    await expect(
      voteForTimeByIdUseCase({
        userId: user.id,
        teamId: secondTeam.id,
        token: code,
      }),
    ).rejects.toThrow(ConflictError);

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].teamId).toBe(firstTeam.id);
  });

  it("email fallback vote (null phone) does not block another user from using the same phone", async () => {
    const [userA] = await db
      .insert(usersSchema)
      .values({ name: "User A", email: IntegrationTestHelper.generateTestEmail() })
      .returning();

    const [userB] = await db
      .insert(usersSchema)
      .values({ name: "User B", email: IntegrationTestHelper.generateTestEmail() })
      .returning();

    const [teamA] = await db
      .insert(teamsSchema)
      .values({ name: "Team A", slug: "test-team-phone-a" })
      .returning();

    const [teamB] = await db
      .insert(teamsSchema)
      .values({ name: "Team B", slug: "test-team-phone-b" })
      .returning();

    const codeA = "111111";
    await seedToken(userA.id, null, codeA, "email");

    await voteForTimeByIdUseCase({
      userId: userA.id,
      teamId: teamA.id,
      token: codeA,
    });

    const phone = "+5511900000099";
    const codeB = "222222";
    await seedToken(userB.id, phone, codeB, "whatsapp");

    const result = await voteForTimeByIdUseCase({
      userId: userB.id,
      teamId: teamB.id,
      token: codeB,
    });

    expect(result.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(2);

    const voteA = votes.find((v) => v.userId === userA.id)!;
    const voteB = votes.find((v) => v.userId === userB.id)!;

    expect(voteA.phoneNumber).toBeNull();
    expect(voteA.channel).toBe("email");
    expect(voteB.phoneNumber).toBe(phone);
    expect(voteB.channel).toBe("whatsapp");
  });

  it("full flow: createVoteToken with WhatsApp fallback → voteForTeam stores email channel and null phone", async () => {
    setMessageSenderForTests({
      send: mock(() => { throw new MessageSendError("Evolution API down"); }),
    });

    const [user] = await db
      .insert(usersSchema)
      .values({ name: "Fallback User", email: IntegrationTestHelper.generateTestEmail() })
      .returning();

    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team Fallback", slug: "test-team-fallback" })
      .returning();

    const phone = "+5591988001122";
    const tokenResult = await createVoteTokenUseCase(user.id, { phoneNumber: phone });

    expect(tokenResult.channel).toBe("email");

    const tokens = await db.select().from(votesTokensSchema);
    expect(tokens).toHaveLength(1);
    const token = tokens[0];
    expect(token.channel).toBe("email");
    expect(token.phoneNumber).toBeNull();

    const code = await findCodeFromHash(token.tokenHash);

    const voteResult = await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: team.id,
      token: code,
    });

    expect(voteResult.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].phoneNumber).toBeNull();
    expect(votes[0].channel).toBe("email");
    expect(votes[0].teamId).toBe(team.id);
    expect(votes[0].userId).toBe(user.id);
  });
});

async function findCodeFromHash(hash: string): Promise<string> {
  for (let i = 0; i < 1_000_000; i++) {
    const candidate = i.toString().padStart(6, "0");
    if (createHash("sha256").update(candidate).digest("hex") === hash) {
      return candidate;
    }
  }
  throw new Error("Could not find code for hash");
}
