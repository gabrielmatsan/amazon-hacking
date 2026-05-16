import { NotFoundError } from "@/shared/infra/errors/not-found-error";

import type { Team, UpdateTeamBody } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function updateTeamUseCase(id: string, input: UpdateTeamBody): Promise<Team> {
  const team = await TeamsRepository.update(id, input);
  if (!team) throw new NotFoundError("Team not found");

  return team;
}
