import { createHash } from "crypto";

import { db } from "@/shared/infra/databases/postgres";
import { env } from "@/shared/infra/env/env";
import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { ForbiddenError } from "@/shared/infra/errors/forbidden-error";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { normalizeEmail } from "@/shared/utils/normalize-email";
import { TeamsRepository } from "@/teams/infra/teams.repository";
import { UsersRepository } from "@/users/infra/users.repository";
import { VoteTokensRepository } from "@/votes-token/infra/votes-tokens.repository";
import { t, type Static } from "elysia";

import { VotesRepository } from "../infra/votes.repository";

export const voteForTimeByIdInput = t.Object({
  teamId: t.String(),
  token: t.String({ minLength: 6, maxLength: 6 }),
  userId: t.String(),
  fingerprint: t.Optional(t.String()),
  ipAddress: t.Optional(t.String()),
  ipCountry: t.Optional(t.String()),
  userAgent: t.Optional(t.String()),
  metadata: t.Optional(t.Any()),
});

type VoteForTimeByIdInput = Static<typeof voteForTimeByIdInput>;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export const voteForTimeByIdUseCase = async (input: VoteForTimeByIdInput) => {
  const [user, team] = await Promise.all([
    UsersRepository.findById(input.userId),
    TeamsRepository.findById(input.teamId),
  ]);

  if (!user) throw new NotFoundError("User not found");
  if (!team) throw new NotFoundError("Team not found");

  const existingVote = await VotesRepository.findByUserId(input.userId);
  if (existingVote) throw new ConflictError("User already voted");

  const votesByEmail = await VotesRepository.countByNormalizedEmail(normalizeEmail(user.email));
  if (votesByEmail >= env.MAX_VOTES_PER_NORMALIZED_EMAIL) {
    throw new ForbiddenError("Vote limit reached for this email");
  }

  const tokenHash = sha256(input.token);

  const validToken = await VoteTokensRepository.findValidByUserAndHash(
    input.userId,
    tokenHash,
  );

  if (!validToken) {
    // Outside a transaction so the attempt count persists even when we throw.
    const latest = await VoteTokensRepository.findLatestValidByUser(input.userId);
    if (latest) {
      const attempts = await VoteTokensRepository.incrementAttempts(latest.id);
      if (attempts >= env.VOTE_TOKEN_MAX_ATTEMPTS) {
        await VoteTokensRepository.markAsUsed(latest.id);
      }
    }
    throw new UnauthorizedError("Invalid verification code");
  }

  return db.transaction(async (tx) => {
    await VoteTokensRepository.markAsUsed(validToken.id, tx);

    const vote = await VotesRepository.create(
      {
        userId: input.userId,
        teamId: input.teamId,
        phoneNumber: validToken.phoneNumber ?? undefined,
        channel: validToken.channel ?? "whatsapp",
        fingerprint: input.fingerprint,
        ipAddress: input.ipAddress,
        ipCountry: input.ipCountry,
        userAgent: input.userAgent,
        metadata: input.metadata,
        status: "valid",
      },
      tx,
    );

    if (!vote) throw new ConflictError("User already voted");

    return { message: "Vote created successfully" };
  });
};
