import { beforeAll, beforeEach, describe, expect, it } from "bun:test";

import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { teamsSchema } from "@/teams/domain/teams.schema";
import { usersSchema } from "@/users/domain/users.schema";
import { votesSchema } from "../domain/votes.schema";

import { voteForTimeByIdUseCase } from "./vote-for-time-by-id.usecase";

describe("voteForTimeByIdUseCase", () => {
  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
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

    await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: firstTeam.id,
    });

    await expect(
      voteForTimeByIdUseCase({
        userId: user.id,
        teamId: secondTeam.id,
      }),
    ).rejects.toThrow(ConflictError);

    const votes = await db.select().from(votesSchema);
    expect(votes).toHaveLength(1);
    expect(votes[0].teamId).toBe(firstTeam.id);
  });
});
