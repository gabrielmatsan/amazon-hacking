import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { logger } from "@/shared/infra/observability";
import { VotesRepository } from "../infra/votes.repository";

export async function approveVoteUseCase(id: string) {
  const vote = await VotesRepository.updateStatus(id, "valid");
  if (!vote) {
    logger.warn({ voteId: id }, "Approve vote aborted: vote not found");
    throw new NotFoundError("Vote not found");
  }
  logger.info({ voteId: id, teamId: vote.teamId }, "Flagged vote manually approved (marked valid)");
  return vote;
}

export async function invalidateVoteUseCase(id: string) {
  const vote = await VotesRepository.updateStatus(id, "invalidated");
  if (!vote) {
    logger.warn({ voteId: id }, "Invalidate vote aborted: vote not found");
    throw new NotFoundError("Vote not found");
  }
  logger.info({ voteId: id, teamId: vote.teamId }, "Vote manually invalidated by moderator");
  return vote;
}
