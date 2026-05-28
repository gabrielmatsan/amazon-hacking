import { NotFoundError } from "@/shared/infra/errors/not-found-error";

import type { Team } from "../domain/teams.type";
import { TeamAuditLogsRepository } from "../infra/team-audit-logs.repository";
import { TeamsRepository } from "../infra/teams.repository";

export async function approveTeamUseCase(id: string, performedBy: string): Promise<Team> {
  const existing = await TeamsRepository.findById(id);
  if (!existing) {
    throw new NotFoundError("Team not found");
  }

  const team = await TeamsRepository.update(id, {
    status: "active",
    rejectionReason: null,
  });

  await TeamAuditLogsRepository.create({
    teamId: id,
    action: "approved",
    performedBy,
  });

  return team!;
}
