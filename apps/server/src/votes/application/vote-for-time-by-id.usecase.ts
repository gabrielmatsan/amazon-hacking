import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { UsersRepository } from "@/users/infra/users.repository";
import { TeamsRepository } from "@/teams/infra/teams.repository";
import { t, type Static } from "elysia";
import { VotesRepository } from "../infra/votes.repository";

export const voteForTimeByIdInput = t.Object({
  teamId: t.String(),
  userId: t.String(),
  ipAddress: t.Optional(t.String()),
  ipCountry: t.Optional(t.String()),
  userAgent: t.Optional(t.String()),
  metadata: t.Optional(t.Any()),
})

type VoteForTimeByIdInput = Static<typeof voteForTimeByIdInput>;


export const voteForTimeByIdUseCase = async (input: VoteForTimeByIdInput) => {
  // 1. Pega o usuário e a equipe
  const [user, team] = await Promise.all([
    UsersRepository.findById(input.userId),
    TeamsRepository.findById(input.teamId),
  ]);

  // 2. Valida se o usuário e a equipe existem
  if (!user) throw new NotFoundError("User not found");
  if (!team) throw new NotFoundError("Team not found");

  // 3. Valida se o usuário já votou
  const thisUserAlreadyVoted = await VotesRepository.findByUserId(input.userId);
  if (thisUserAlreadyVoted) throw new ConflictError("User already voted");

  // 4. Cria o voto
  const vote = await VotesRepository.create({
    userId: input.userId,
    teamId: input.teamId,
    ipAddress: input.ipAddress,
    ipCountry: input.ipCountry,
    userAgent: input.userAgent,
    metadata: input.metadata,
    status: "valid",
  });

  if (!vote) throw new ConflictError("User already voted");

  return {
    message: "Vote created successfully",
  };
}
