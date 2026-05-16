import type { CreateTeamBody, Team } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function createTeamUseCase(input: CreateTeamBody): Promise<Team> {
  return TeamsRepository.create(input);
}
