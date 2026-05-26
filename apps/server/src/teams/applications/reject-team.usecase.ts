import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { resendEmailClient } from "@/shared/mail/resend/index";
import { UsersRepository } from "@/users/infra/users.repository";

import type { Team } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function rejectTeamUseCase(id: string, reason: string): Promise<Team> {
  const existing = await TeamsRepository.findById(id);
  if (!existing) {
    throw new NotFoundError("Team not found");
  }

  const team = await TeamsRepository.update(id, {
    status: "rejected",
    rejectionReason: reason,
  });

  const leader = await UsersRepository.findByTeamId(id);
  if (leader) {
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
  }

  return team!;
}
