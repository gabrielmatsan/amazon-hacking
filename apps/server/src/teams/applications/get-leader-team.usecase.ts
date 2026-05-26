import { NotFoundError } from "@/shared/infra/errors/not-found-error";

import type { Team } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function getLeaderTeamUseCase(teamId: string | null): Promise<Team> {
  if (!teamId) {
    throw new NotFoundError("You don't have a team");
  }

  const team = await TeamsRepository.findById(teamId);
  if (!team) {
    throw new NotFoundError("Team not found");
  }

  return team;
}
