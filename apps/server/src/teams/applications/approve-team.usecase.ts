import { logger } from "@/shared/infra/observability";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";

import type { Team } from "../domain/teams.type";
import { TeamAuditLogsRepository } from "../infra/team-audit-logs.repository";
import { TeamsRepository } from "../infra/teams.repository";

export async function approveTeamUseCase(id: string, performedBy: string): Promise<Team> {
  const existing = await TeamsRepository.findById(id);
  if (!existing) {
    logger.warn({ teamId: id, performedBy }, "Approve team aborted: team not found");
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

  logger.info(
    { teamId: id, teamName: existing.name, previousStatus: existing.status, performedBy },
    "Team approved and set to active",
  );

  return team!;
}
