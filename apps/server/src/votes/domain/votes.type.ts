import { t, type Static } from "elysia";

export const voteSources = {
  user: "user",
  mentor: "mentor",
} as const;

export const voteStatus = {
  valid: "valid",
  flagged: "flagged",
  invalidated: "invalidated",
} as const;


export const voteType = t.Object({
  id: t.String(),
  userId: t.String(),
  teamId: t.String(),
  status: t.Enum(voteStatus),
  source: t.Enum(voteSources),
  ipAddress: t.Nullable(t.String()),
  ipCountry: t.Nullable(t.String()),
  userAgent: t.Nullable(t.String()),
  metadata: t.Nullable(t.Any()),
  createdAt: t.Date(),
  updatedAt: t.Nullable(t.Date()),
})

export type VoteType = Static<typeof voteType>;
export type VoteStatusType = VoteType["status"];
export type VoteSourceType = VoteType["source"];