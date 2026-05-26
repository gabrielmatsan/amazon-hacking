import type { Team } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function listTeamsByStatusUseCase(
  status: "active" | "review" | "rejected",
): Promise<Team[]> {
  return TeamsRepository.findByStatus(status);
}
