import { t, type Static } from "elysia";

export const teamMemberType = t.Object({
  name: t.String(),
  role: t.String(),
  email: t.Optional(t.String()),
  imageUrl: t.Optional(t.String()),
  links: t.Optional(
    t.Object({
      website: t.Optional(t.String()),
      linkedin: t.Optional(t.String()),
      github: t.Optional(t.String()),
    })
  ),
});

export const teamType = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  logoUrl: t.Nullable(t.String()),
  teamMembers: t.Nullable(t.Array(teamMemberType)),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export type Team = Static<typeof teamType>;
export type TeamMember = Static<typeof teamMemberType>;