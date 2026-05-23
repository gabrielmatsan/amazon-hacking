import { createHash } from "crypto";

import { beforeAll, beforeEach, describe, expect, it } from "bun:test";

import { db } from "@/shared/infra/databases/postgres";
import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { teamsSchema } from "@/teams/domain/teams.schema";
import { usersSchema } from "@/users/domain/users.schema";
import { votesTokensSchema } from "@/votes-token/domain/votes-tokens.schema";

import { votesSchema } from "../domain/votes.schema";
import { voteForTimeByIdUseCase } from "./vote-for-time-by-id.usecase";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function seedValidToken(userId: string, phoneNumber: string, code: string) {
  await db.insert(votesTokensSchema).values({
    userId,
    phoneNumber,
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

  it("creates a vote when token is valid and copies the phone number", async () => {
    const [user] = await db
      .insert(usersSchema)
      .values({
        name: "Maria",
        email: IntegrationTestHelper.generateTestEmail(),
      })
      .returning();

    const [team] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Alpha" })
      .returning();

    const phone = "+5511900000010";
    const code = "123456";
    await seedValidToken(user.id, phone, code);

    const result = await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: team.id,
      token: code,
    });

    expect(result.message).toBe("Vote created successfully");

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].phoneNumber).toBe(phone);
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
      .values({ name: "Equipe Beta" })
      .returning();

    const phone = "+5511900000011";
    await seedValidToken(user.id, phone, "999999");

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
      .values({ name: "Equipe Alpha" })
      .returning();

    const [secondTeam] = await db
      .insert(teamsSchema)
      .values({ name: "Equipe Beta" })
      .returning();

    const phone = "+5511900000012";
    const code = "555555";
    await seedValidToken(user.id, phone, code);

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
});
