import { type Static, t } from "elysia";

import { TeamsRepository } from "../infra/teams.repository";

export const teamListItemSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  logoUrl: t.Nullable(t.String()),
});

export type TeamListItem = Static<typeof teamListItemSchema>;

export async function listTeams(): Promise<TeamListItem[]> {
  return TeamsRepository.findAllPublic();
}
