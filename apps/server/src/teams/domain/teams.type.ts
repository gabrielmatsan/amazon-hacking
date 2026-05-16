import { t, type Static } from "elysia";

export const teamMemberType = t.Object({
  name: t.String({ minLength: 1, error: "teamMember.name is required" }),
  role: t.String({ minLength: 1, error: "teamMember.role is required" }),
  email: t.Optional(t.String({ format: "email" })),
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

export const createTeamBody = t.Object(
  {
    name: t.String({ minLength: 1, error: "name is required" }),
    description: t.Optional(t.String()),
    teamMembers: t.Optional(t.Array(teamMemberType)),
  },
  { additionalProperties: false },
);

export const updateTeamBody = t.Object(
  {
    name: t.Optional(t.String({ minLength: 1, error: "name is required" })),
    description: t.Optional(t.Nullable(t.String())),
    teamMembers: t.Optional(t.Nullable(t.Array(teamMemberType))),
  },
  { additionalProperties: false },
);

export type Team = Static<typeof teamType>;
export type TeamMember = Static<typeof teamMemberType>;
export type CreateTeamBody = Static<typeof createTeamBody>;
export type UpdateTeamBody = Static<typeof updateTeamBody>;