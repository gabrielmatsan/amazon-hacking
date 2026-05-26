import { NotFoundError } from "@/shared/infra/errors/not-found-error";

import type { Team, UpdateLeaderTeamBody } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function updateLeaderTeamUseCase(
  teamId: string | null,
  input: UpdateLeaderTeamBody,
): Promise<Team> {
  if (!teamId) {
    throw new NotFoundError("You don't have a team");
  }

  const team = await TeamsRepository.update(teamId, {
    ...input,
    status: "review",
    rejectionReason: null,
  });

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  return team;
}
