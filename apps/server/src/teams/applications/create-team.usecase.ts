import { logger } from "@/shared/infra/observability";

import type { CreateTeamBody, Team } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function createTeamUseCase(input: CreateTeamBody): Promise<Team> {
  const team = await TeamsRepository.create(input);
  logger.info({ teamId: team.id, teamName: team.name, slug: team.slug, status: team.status }, "Team created");
  return team;
}
