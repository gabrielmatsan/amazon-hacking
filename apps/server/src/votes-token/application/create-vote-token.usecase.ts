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

import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { resendEmailClient } from "@/shared/mail/resend";
import { UsersRepository } from "@/users/infra/users.repository";
import { VoteTokensRepository } from "../infra/votes-tokens.repository";

export const createVoteTokenInput = t.Object({
  phoneNumber: t.String({ minLength: 6, maxLength: 25 }),
});

type CreateVoteTokenInput = Static<typeof createVoteTokenInput>;

export type VoteChannel = "whatsapp" | "email";

export interface CreateVoteTokenResult {
  message: string;
  expiresAt: Date;
  channel: VoteChannel;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function generateCode(): string {
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

  const user = await UsersRepository.findById(userId);
  if (!user) throw new NotFoundError("User not found");

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

  const code = generateCode();
  const tokenHash = sha256(code);
  const expiresAt = new Date(Date.now() + env.VOTE_TOKEN_TTL_SECONDS * 1000);
  const ttlMinutes = Math.round(env.VOTE_TOKEN_TTL_SECONDS / 60);

  const sender = getMessageSender();
  let channel: VoteChannel = "whatsapp";

  await db.transaction(async (tx) => {
    await VoteTokensRepository.supersedePreviousValidByUser(userId, tx);

    try {
      await sender.send(
        phoneNumber,
        `Seu codigo de verificacao e ${code}. Expira em ${ttlMinutes} min.`,
      );

      await VoteTokensRepository.create(
        { userId, phoneNumber, tokenHash, expiresAt, channel: "whatsapp" },
        tx,
      );
    } catch (err) {
      if (err instanceof MessageSendError) {
        logger.warn({ err, phoneNumber }, "WhatsApp delivery failed, falling back to email");
      } else {
        logger.error({ err, phoneNumber }, "Unexpected error sending WhatsApp, falling back to email");
      }

      channel = "email";

      await VoteTokensRepository.create(
        { userId, phoneNumber: null, tokenHash, expiresAt, channel: "email" },
        tx,
      );

      await Promise.all([
        resendEmailClient.sendEmail({
          to: user.email,
          subject: "Código de verificação — Amazon Hacking",
          template: `
            <p>Olá, ${user.name}!</p>
            <p>Seu código de verificação é: <strong>${code}</strong></p>
            <p>Expira em ${ttlMinutes} minutos.</p>
          `,
        }),
        resendEmailClient.sendEmail({
          to: ["gabrielmatsan@hotmail.com", "ryan@tucupy.com"],
          subject: "⚠ Fallback email ativado — falha no WhatsApp",
          template: `
            <p>Não foi possível enviar o código via WhatsApp para ${phoneNumber}.</p>
            <p>Usuário: ${user.name} (${user.email})</p>
            <p>O código foi enviado por email como fallback.</p>
          `,
        }),
      ]);
    }
  });

  return { message: "Verification code sent", expiresAt, channel };
}
