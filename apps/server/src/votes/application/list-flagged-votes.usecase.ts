import { t, type Static } from "elysia";
import { VotesRepository } from "../infra/votes.repository";

export const flaggedVoteItem = t.Object({
  id: t.String(),
  status: t.String(),
  channel: t.String(),
  phoneNumber: t.Nullable(t.String()),
  ipAddress: t.Nullable(t.String()),
  ipCountry: t.Nullable(t.String()),
  userAgent: t.Nullable(t.String()),
  fingerprint: t.Nullable(t.String()),
  metadata: t.Any(),
  createdAt: t.Date(),
  teamName: t.String(),
  teamSlug: t.String(),
  userName: t.String(),
  userEmail: t.String(),
});

export const flaggedVotesOutput = t.Object({
  items: t.Array(flaggedVoteItem),
  nextCursor: t.Nullable(t.String()),
});

export type FlaggedVotesOutput = Static<typeof flaggedVotesOutput>;

export async function listFlaggedVotesUseCase(
  cursor?: string,
  limit = 10,
): Promise<FlaggedVotesOutput> {
  return VotesRepository.findFlaggedCursor(cursor, limit);
}
