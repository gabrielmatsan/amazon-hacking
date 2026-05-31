import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { logger } from "@/shared/infra/observability";

import { env } from "@/shared/infra/env/env";
import { ForbiddenError } from "@/shared/infra/errors/forbidden-error";
import type { Team, UpdateLeaderTeamBody } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function updateLeaderTeamUseCase(
  teamId: string | null,
  input: UpdateLeaderTeamBody,
): Promise<Team> {

  if (env.NODE_ENV === "production") {
    throw new ForbiddenError("Cannot update team now.");
  }

  if (!teamId) {
    logger.warn("Leader update aborted: caller has no team associated");
    throw new NotFoundError("You don't have a team");
  }

  const team = await TeamsRepository.update(teamId, {
    ...input,
    status: "review",
    rejectionReason: null,
  });

  if (!team) {
    logger.warn({ teamId }, "Leader update aborted: team not found");
    throw new NotFoundError("Team not found");
  }

  logger.info(
    { teamId, teamName: team.name, updatedFields: Object.keys(input) },
    "Leader updated their team, status reset to review",
  );

  return team;
}
