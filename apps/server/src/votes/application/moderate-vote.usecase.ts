import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { VotesRepository } from "../infra/votes.repository";

export async function approveVoteUseCase(id: string) {
  const vote = await VotesRepository.updateStatus(id, "valid");
  if (!vote) throw new NotFoundError("Vote not found");
  return vote;
}

export async function invalidateVoteUseCase(id: string) {
  const vote = await VotesRepository.updateStatus(id, "invalidated");
  if (!vote) throw new NotFoundError("Vote not found");
  return vote;
}
