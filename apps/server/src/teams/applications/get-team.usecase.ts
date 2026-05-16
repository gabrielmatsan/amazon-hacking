import { type Static, t } from "elysia";

import { NotFoundError } from "@/shared/infra/errors/not-found-error";

import type { Team } from "../domain/teams.type";
import { TeamsRepository } from "../infra/teams.repository";




export async function getTeam(id: string): Promise<Team> {
  const team = await TeamsRepository.findById(id);
  if (!team) throw new NotFoundError("Team not found");
  return team;
}
