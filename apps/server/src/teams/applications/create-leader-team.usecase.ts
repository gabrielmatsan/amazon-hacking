import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { UsersRepository } from "@/users/infra/users.repository";

import type { CreateLeaderTeamBody, Team } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createLeaderTeamUseCase(
  userId: string,
  teamId: string | null,
  input: CreateLeaderTeamBody,
): Promise<Team> {
  if (teamId) {
    throw new ConflictError("You already have a team");
  }

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
    status: "review",
    createdBy: userId,
  });

  await UsersRepository.updateTeamId(userId, team.id);

  return team;
}
