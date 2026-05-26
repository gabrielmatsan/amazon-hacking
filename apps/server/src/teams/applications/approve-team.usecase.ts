import { NotFoundError } from "@/shared/infra/errors/not-found-error";

import type { Team } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function approveTeamUseCase(id: string): Promise<Team> {
  const existing = await TeamsRepository.findById(id);
  if (!existing) {
    throw new NotFoundError("Team not found");
  }

  const team = await TeamsRepository.update(id, {
    status: "active",
    rejectionReason: null,
  });

  return team!;
}
