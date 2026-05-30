import { ConflictError } from "@/shared/infra/errors/conflict-error";
import { logger } from "@/shared/infra/observability";
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
    logger.warn({ userId, existingTeamId: teamId }, "Leader tried to create a team but already owns one");
    throw new ConflictError("You already have a team");
  }

  let slug = generateSlug(input.name);
  const exists = await TeamsRepository.slugExists(slug);
  if (exists) {
    slug = `${slug}-${Date.now()}`;
    logger.info({ userId, baseSlug: generateSlug(input.name), resolvedSlug: slug }, "Slug collision resolved with timestamp suffix");
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

  logger.info(
    { userId, teamId: team.id, teamName: team.name, slug: team.slug, status: team.status },
    "Leader created their team and is now associated with it (pending review)",
  );

  return team;
}
