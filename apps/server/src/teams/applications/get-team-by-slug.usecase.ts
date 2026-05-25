import { NotFoundError } from "@/shared/infra/errors/not-found-error";

import type { Team } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";

export async function getTeamBySlug(slug: string): Promise<Team> {
  const team = await TeamsRepository.findBySlug(slug);
  if (!team) throw new NotFoundError("Team not found");
  return team;
}