import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { resendEmailClient } from "@/shared/mail/resend/index";
import { UsersRepository } from "@/users/infra/users.repository";

import { logger } from "@/shared/infra/observability";
import type { Team } from "../domain/teams.type";
import { TeamAuditLogsRepository } from "../infra/team-audit-logs.repository";
import { TeamsRepository } from "../infra/teams.repository";

export async function rejectTeamUseCase(id: string, reason: string, performedBy: string): Promise<Team> {
  const existing = await TeamsRepository.findById(id);
  if (!existing) {
    logger.warn({ teamId: id, performedBy }, "Reject team aborted: team not found");
    throw new NotFoundError("Team not found");
  }

  const team = await TeamsRepository.update(id, {
    status: "rejected",
    rejectionReason: reason,
  });

  await TeamAuditLogsRepository.create({
    teamId: id,
    action: "rejected",
    performedBy,
    reason,
  });

  logger.info(
    { teamId: id, teamName: existing.name, previousStatus: existing.status, performedBy, reason },
    "Team rejected and sent back for revision",
  );

  const leader = await UsersRepository.findByTeamId(id);
  if (leader) {
    logger.info(
      { teamId: id, leaderEmail: leader.email },
      "Notifying team leader about rejection via email",
    );
    await resendEmailClient.sendEmail({
      to: leader.email,
      subject: `Equipe "${existing.name}" — Revisão necessária`,
      template: `
        <h2>Olá, ${leader.name}!</h2>
        <p>Sua equipe <strong>${existing.name}</strong> foi revisada e precisa de ajustes.</p>
        <h3>Motivo:</h3>
        <p>${reason}</p>
        <p>Acesse a plataforma para fazer as correções necessárias.</p>
      `,
    });
    logger.info({ teamId: id, leaderEmail: leader.email }, "Rejection email sent to team leader");
  } else {
    logger.warn({ teamId: id }, "Team rejected but no leader is associated, skipping email notification");
  }

  return team!;
}
