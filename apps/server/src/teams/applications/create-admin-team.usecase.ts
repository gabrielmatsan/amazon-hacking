import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { logger } from "@/shared/infra/observability";
import { UsersRepository } from "@/users/infra/users.repository";

import { db } from "@/shared/infra/databases/postgres";
import type { CreateAdminTeamBody, Team } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createAdminTeamUseCase(
  input: CreateAdminTeamBody,
  createdBy: string,
): Promise<Team> {


  let createLeaderTeam = false;
  if (input.leaderId) {
    const leader = await UsersRepository.findById(input.leaderId);

    if (!leader) {
      logger.warn({ createdBy, leaderId: input.leaderId }, "Admin team creation aborted: leader id not found");
      throw new NotFoundError("Leader not found with the provided id");
    }

    if (leader.role === 'admin') {
      logger.warn({ createdBy, leaderId: input.leaderId }, "Admin team creation aborted: cannot assign an admin as leader");
      throw new ConflictError("Cannot create a team with an admin as leader");
    }

    if (leader.teamId) {
      logger.warn({ createdBy, leaderId: input.leaderId, existingTeamId: leader.teamId }, "Admin team creation aborted: leader already owns a team");
      throw new ConflictError("This leader already has a team");
    }

    createLeaderTeam = true;
  }


  return await db.transaction(async (tx) => {
    let slug = generateSlug(input.name);

    const exists = await TeamsRepository.slugExists(slug);
    if (exists) {
      slug = `${slug}-${Date.now()}`;
    }

    const team = await TeamsRepository.create({
      name: input.name,
      description: input.description ?? null,
      teamMembers: input.teamMembers ?? null,
      videoUrl: input.videoUrl ?? null,
      secondaryVideoUrl: input.secondaryVideoUrl ?? null,
      solutionPillar: input.solutionPillar ?? "default",
      logoUrl: input.logoUrl ?? null,
      slug,
      status: "active",
      createdBy,
    }, tx);

    if (createLeaderTeam && input.leaderId) {
      await UsersRepository.updateTeamId(input.leaderId, team.id);
      logger.info({ teamId: team.id, leaderId: input.leaderId }, "Leader associated with admin-created team");
    }

    logger.info(
      { teamId: team.id, teamName: team.name, slug: team.slug, status: team.status, createdBy, leaderId: input.leaderId ?? null },
      "Team created by admin (active)",
    );

    return team;
  })
}
