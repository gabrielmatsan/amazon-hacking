import { type Static, t } from "elysia";

import { solutionPillarType } from "../domain/teams.type";
import { TeamsRepository, type TeamListGroup } from "../infra/teams.repository";

export const teamListItemSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  logoUrl: t.Nullable(t.String()),
});

export type TeamListItem = Static<typeof teamListItemSchema>;

export const teamListGroupSchema = t.Object({
  solutionPillar: solutionPillarType,
  teams: t.Array(teamListItemSchema),
});

export type TeamListGroupResponse = Static<typeof teamListGroupSchema>;

export async function listTeams(): Promise<TeamListGroup[]> {
  return TeamsRepository.findAllPublic();
}
