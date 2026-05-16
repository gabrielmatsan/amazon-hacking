import { t, type Static } from "elysia";
import { VotesRepository } from "../infra/votes.repository";

export const checkVotesOutput = t.Array(
  t.Object({
    teamId: t.String(),
    teamName: t.String(),
    votesCount: t.Number(),
  })
)

type CheckVotesOutput = Static<typeof checkVotesOutput>;

export async function checkVotesUseCase(): Promise<CheckVotesOutput> {
  return VotesRepository.votesCount();
}