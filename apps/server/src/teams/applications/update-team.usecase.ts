import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { logger } from "@/shared/infra/observability";

import type { Team, UpdateTeamBody } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function updateTeamUseCase(id: string, input: UpdateTeamBody): Promise<Team> {
  const team = await TeamsRepository.update(id, input);
  if (!team) {
    logger.warn({ teamId: id }, "Update team aborted: team not found");
    throw new NotFoundError("Team not found");
  }

  logger.info(
    { teamId: id, teamName: team.name, updatedFields: Object.keys(input) },
    "Team updated by admin",
  );

  return team;
}
