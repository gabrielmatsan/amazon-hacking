import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
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
): Promise<Team> {


  let createLeaderTeam = false;
  if (input.leaderId) {
    const leader = await UsersRepository.findById(input.leaderId);

    if (!leader) {
      throw new NotFoundError("Leader not found with the provided id");
    }

    if (leader.role === 'admin') {
      throw new ConflictError("Cannot create a team with an admin as leader");
    }

    if (leader.teamId) {
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
    }, tx);

    if (createLeaderTeam && input.leaderId) {
      await UsersRepository.updateTeamId(input.leaderId, team.id);
    }

    return team;
  })
}
