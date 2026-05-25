import { t, type Static } from "elysia";

export const voteTokenStatus = {
  valid: "valid",
  used: "used",
  superseded: "superseded",
} as const;

export const voteTokenChannelType = {
  whatsapp: "whatsapp",
  email: "email",
} as const;

export const voteTokensType = t.Object({
  id: t.String(),
  userId: t.String(),
  tokenHash: t.String(),
  phoneNumber: t.Nullable(t.String()),
  channel: t.Enum(voteTokenChannelType),
  status: t.Enum(voteTokenStatus),
  attempts: t.Number(),
  expiresAt: t.Date(),
  createdAt: t.Date(),
  updatedAt: t.Nullable(t.Date()),
});

export type VoteTokensType = Static<typeof voteTokensType>;
export type VoteTokenStatusType = (typeof voteTokenStatus)[keyof typeof voteTokenStatus];
export type VoteTokenChannelType = (typeof voteTokenChannelType)[keyof typeof voteTokenChannelType];