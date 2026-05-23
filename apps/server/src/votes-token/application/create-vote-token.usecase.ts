import { createHash, randomInt } from "crypto";

import parsePhoneNumberFromString from "libphonenumber-js";

import { db } from "@/shared/infra/databases/postgres";
import { env } from "@/shared/infra/env/env";
import { BadRequestError } from "@/shared/infra/errors/bad-error-request";
import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { getMessageSender, MessageSendError } from "@/shared/infra/messaging";
import { logger } from "@/shared/infra/observability";
import { VotesRepository } from "@/votes/infra/votes.repository";
import { t, type Static } from "elysia";

import { VoteTokensRepository } from "../infra/votes-tokens.repository";

export const createVoteTokenInput = t.Object({
  phoneNumber: t.String({ minLength: 6, maxLength: 25 }),
});

type CreateVoteTokenInput = Static<typeof createVoteTokenInput>;

export interface CreateVoteTokenResult {
  message: string;
  expiresAt: Date;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function generateCode(): string {
  // 6-digit numeric, cryptographically secure
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function normalizePhone(raw: string): string {
  const parsed = parsePhoneNumberFromString(raw, "BR");
  if (!parsed || !parsed.isValid()) {
    throw new BadRequestError("Invalid phone number");
  }
  return parsed.number;
}

export async function createVoteTokenUseCase(
  userId: string,
  input: CreateVoteTokenInput,
): Promise<CreateVoteTokenResult> {
  const phoneNumber = normalizePhone(input.phoneNumber);

  const existingVote = await VotesRepository.findByUserId(userId);
  if (existingVote) throw new ConflictError("User already voted");


  const existingVoteByPhone = await VotesRepository.findByPhoneNumber(phoneNumber);

  if (existingVoteByPhone) throw new ConflictError("Phone number is already used");

  const recentCount = await VoteTokensRepository.countRecent(
    userId,
    phoneNumber,
    env.VOTE_TOKEN_RATE_LIMIT_WINDOW_SECONDS,
  );

  if (recentCount >= env.VOTE_TOKEN_RATE_LIMIT_COUNT) {
    throw new ConflictError("Too many token requests, try again later");
  }

  // const collidingToken = await VoteTokensRepository.findActiveByPhoneOtherUser(
  //   phoneNumber,
  //   userId,
  // );
  // if (collidingToken) {
  //   throw new ConflictError("Phone number is already in use");
  // }

  const code = generateCode();
  const tokenHash = sha256(code);
  const expiresAt = new Date(Date.now() + env.VOTE_TOKEN_TTL_SECONDS * 1000);

  const sender = getMessageSender();

  try {
    await db.transaction(async (tx) => {
      await VoteTokensRepository.supersedePreviousValidByUser(userId, tx);

      await VoteTokensRepository.create(
        { userId, phoneNumber, tokenHash, expiresAt },
        tx,
      );

      // Send inside the transaction so a delivery failure rolls back the insert.
      await sender.send(
        phoneNumber,
        `Seu codigo de verificacao e ${code}. Expira em ${Math.round(
          env.VOTE_TOKEN_TTL_SECONDS / 60,
        )} min.`,
      );
    });
  } catch (err) {
    if (err instanceof MessageSendError) {
      logger.warn({ err, phoneNumber }, "Failed to deliver vote token");
      throw new BadRequestError(
        "Could not deliver the verification code, check the phone number",
      );
    }
    throw err;
  }

  return { message: "Verification code sent", expiresAt };
}
