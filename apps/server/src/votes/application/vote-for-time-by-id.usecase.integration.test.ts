import { createHash } from "crypto";

import { beforeAll, beforeEach, describe, expect, it, mock } from "bun:test";

import { appConfigSchema } from "@/config/domain/config.schema";
import { db } from "@/shared/infra/databases/postgres";
import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { ForbiddenError } from "@/shared/infra/errors/forbidden-error";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { MessageSendError, setMessageSenderForTests } from "@/shared/infra/messaging";
import { normalizeEmail } from "@/shared/utils/normalize-email";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { teamsSchema } from "@/teams/domain/teams.schema";
import { usersSchema } from "@/users/domain/users.schema";
import { createVoteTokenUseCase } from "@/votes-token/application/create-vote-token.usecase";
import { votesTokensSchema } from "@/votes-token/domain/votes-tokens.schema";

import { votesSchema } from "../domain/votes.schema";
import { voteForTimeByIdUseCase } from "./vote-for-time-by-id.usecase";

mock.module("@/shared/mail/resend", () => ({
  resendEmailClient: {
    sendEmail: mock(() => Promise.resolve({ success: true })),
  },
}));

const mockCheckIp = mock(() => Promise.resolve(null));
mock.module("@/shared/infra/proxy-api/proxy-api-client", () => ({
  proxyApiClient: {
    assessRisk: mock(() => Promise.resolve(null)),
    checkIp: mockCheckIp,
    checkBatch: mock(() => Promise.resolve(new Map())),
  },
}));

mock.module("@/shared/infra/turnstile/verify-turnstile", () => ({
  verifyTurnstileToken: mock(() => Promise.resolve()),
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

async function seedUser(name = "Test User") {
  const email = IntegrationTestHelper.generateTestEmail();
  const [user] = await db
    .insert(usersSchema)
    .values({ name, email, normalizedEmail: normalizeEmail(email) })
    .returning();
  return user;
}

describe("voteForTimeByIdUseCase", () => {
  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
    mockCheckIp.mockReset();
    mockCheckIp.mockImplementation(() => Promise.resolve(null));
  });

  it("creates a vote via whatsapp with phone number", async () => {
    const user = await seedUser("Maria");

    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Alpha", slug: "test-team-1", status: "active" })
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
    const user = await seedUser("Carlos");

    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Gamma", slug: "test-team-email", status: "active" })
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
    const user = await seedUser("Joao");

    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Beta", slug: "test-team-2", status: "active" })
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
    const user = await seedUser("Maria");

    const [firstTeam] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Alpha", slug: "test-team-3", status: "active" })
      .returning();

    const [secondTeam] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Beta", slug: "test-team-4", status: "active" })
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
    const userA = await seedUser("User A");
    const userB = await seedUser("User B");

    const [teamA] = await db
      .insert(teamsSchema)
      .values({ name: "Team A", slug: "test-team-phone-a", status: "active" })
      .returning();

    const [teamB] = await db
      .insert(teamsSchema)
      .values({ name: "Team B", slug: "test-team-phone-b", status: "active" })
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

    const user = await seedUser("Fallback User");

    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team Fallback", slug: "test-team-fallback", status: "active" })
      .returning();

    const phone = "+5591988001122";
    const tokenResult = await createVoteTokenUseCase(user.id, { phoneNumber: phone, turnstileToken: "test-token" });

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

  it("blocks vote when risk score exceeds maxRiskScore from config", async () => {
    await db.insert(appConfigSchema).values({
      votingEnabled: true,
      maxRiskScore: 50,
    });

    mockCheckIp.mockImplementation(() =>
      Promise.resolve({
        ip: "1.2.3.4",
        detections: { vpn: false, proxy: false, tor: false, hosting: false, compromised: false, risk: 80 },
      }),
    );

    const user = await seedUser("Risky Voter");
    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team Risk", slug: "team-risk-block", status: "active" })
      .returning();

    const code = "654321";
    await seedToken(user.id, "+5511900099001", code);

    await expect(
      voteForTimeByIdUseCase({
        userId: user.id,
        teamId: team.id,
        token: code,
        ipAddress: "1.2.3.4",
      }),
    ).rejects.toThrow(ForbiddenError);

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(0);
  });

  it("allows vote when risk score is within maxRiskScore limit", async () => {
    await db.insert(appConfigSchema).values({
      votingEnabled: true,
      maxRiskScore: 90,
    });

    mockCheckIp.mockImplementation(() =>
      Promise.resolve({
        ip: "1.2.3.4",
        detections: { vpn: false, proxy: false, tor: false, hosting: false, compromised: false, risk: 50 },
      }),
    );

    const user = await seedUser("Safe Voter");
    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team Safe", slug: "team-risk-allow", status: "active" })
      .returning();

    const code = "111222";
    await seedToken(user.id, "+5511900099002", code);

    const result = await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: team.id,
      token: code,
      ipAddress: "1.2.3.4",
    });

    expect(result.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].status).toBe("flagged");
  });

  it("blocks vote when risk score equals maxRiskScore (boundary >=)", async () => {
    await db.insert(appConfigSchema).values({
      votingEnabled: true,
      maxRiskScore: 50,
    });

    mockCheckIp.mockImplementation(() =>
      Promise.resolve({
        ip: "1.2.3.4",
        detections: { vpn: false, proxy: false, tor: false, hosting: false, compromised: false, risk: 50 },
      }),
    );

    const user = await seedUser("Boundary Voter");
    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team Boundary", slug: "team-risk-boundary", status: "active" })
      .returning();

    const code = "777888";
    await seedToken(user.id, "+5511900099010", code);

    await expect(
      voteForTimeByIdUseCase({
        userId: user.id,
        teamId: team.id,
        token: code,
        ipAddress: "1.2.3.4",
      }),
    ).rejects.toThrow(ForbiddenError);

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(0);
  });

  it("allows vote when risk score is one below maxRiskScore (boundary < )", async () => {
    await db.insert(appConfigSchema).values({
      votingEnabled: true,
      maxRiskScore: 50,
    });

    mockCheckIp.mockImplementation(() =>
      Promise.resolve({
        ip: "1.2.3.4",
        detections: { vpn: false, proxy: false, tor: false, hosting: false, compromised: false, risk: 49 },
      }),
    );

    const user = await seedUser("Just Below Voter");
    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team Below", slug: "team-risk-below", status: "active" })
      .returning();

    const code = "888999";
    await seedToken(user.id, "+5511900099011", code);

    const result = await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: team.id,
      token: code,
      ipAddress: "1.2.3.4",
    });

    expect(result.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].status).toBe("flagged");
  });

  it("allows vote as valid when risk is below both maxRiskScore and flagging threshold", async () => {
    await db.insert(appConfigSchema).values({
      votingEnabled: true,
      maxRiskScore: 80,
    });

    mockCheckIp.mockImplementation(() =>
      Promise.resolve({
        ip: "1.2.3.4",
        detections: { vpn: false, proxy: false, tor: false, hosting: false, compromised: false, risk: 10 },
      }),
    );

    const user = await seedUser("Clean Voter");
    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team Clean", slug: "team-risk-clean", status: "active" })
      .returning();

    const code = "444555";
    await seedToken(user.id, "+5511900099012", code);

    const result = await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: team.id,
      token: code,
      ipAddress: "1.2.3.4",
    });

    expect(result.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].status).toBe("valid");
  });

  it("flags vote when risk equals the hardcoded threshold of 33", async () => {
    await db.insert(appConfigSchema).values({
      votingEnabled: true,
      maxRiskScore: 100,
    });

    mockCheckIp.mockImplementation(() =>
      Promise.resolve({
        ip: "1.2.3.4",
        detections: { vpn: false, proxy: false, tor: false, hosting: false, compromised: false, risk: 33 },
      }),
    );

    const user = await seedUser("Threshold 33 Voter");
    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team Threshold", slug: "team-risk-33", status: "active" })
      .returning();

    const code = "555666";
    await seedToken(user.id, "+5511900099013", code);

    const result = await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: team.id,
      token: code,
      ipAddress: "1.2.3.4",
    });

    expect(result.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].status).toBe("flagged");
  });

  it("marks vote as valid when risk is 32 (just below flagging threshold)", async () => {
    await db.insert(appConfigSchema).values({
      votingEnabled: true,
      maxRiskScore: 100,
    });

    mockCheckIp.mockImplementation(() =>
      Promise.resolve({
        ip: "1.2.3.4",
        detections: { vpn: false, proxy: false, tor: false, hosting: false, compromised: false, risk: 32 },
      }),
    );

    const user = await seedUser("Below 33 Voter");
    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team Sub33", slug: "team-risk-sub33", status: "active" })
      .returning();

    const code = "666777";
    await seedToken(user.id, "+5511900099014", code);

    const result = await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: team.id,
      token: code,
      ipAddress: "1.2.3.4",
    });

    expect(result.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].status).toBe("valid");
  });

  it("uses default maxRiskScore (100) when no config exists", async () => {
    mockCheckIp.mockImplementation(() =>
      Promise.resolve({
        ip: "1.2.3.4",
        detections: { vpn: false, proxy: false, tor: false, hosting: false, compromised: false, risk: 99 },
      }),
    );

    const user = await seedUser("Default Config Voter");
    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Team Default", slug: "team-risk-default", status: "active" })
      .returning();

    const code = "333444";
    await seedToken(user.id, "+5511900099003", code);

    const result = await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: team.id,
      token: code,
      ipAddress: "1.2.3.4",
    });

    expect(result.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].status).toBe("flagged");
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
