import { type Static, t } from "elysia";

import { NotFoundError } from "@/shared/infra/errors/not-found-error";

import { TeamsRepository } from "../infra/teams.repository";

export const teamMemberSchema = t.Object({
  name: t.String(),
  role: t.String(),
  email: t.Optional(t.String()),
  imageUrl: t.Optional(t.String()),
  links: t.Optional(
    t.Object({
      website: t.Optional(t.String()),
      linkedin: t.Optional(t.String()),
      github: t.Optional(t.String()),
    }),
  ),
});

export const teamDetailSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  logoUrl: t.Nullable(t.String()),
  teamMembers: t.Nullable(t.Array(teamMemberSchema)),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export type TeamDetail = Static<typeof teamDetailSchema>;

export async function getTeam(id: string): Promise<TeamDetail> {
  const team = await TeamsRepository.findById(id);
  if (!team) throw new NotFoundError("Team not found");
  return team;
}
