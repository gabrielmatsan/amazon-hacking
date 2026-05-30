import { t, type Static } from "elysia";

export const teamMemberType = t.Object({
  name: t.String({
    minLength: 1,
    maxLength: 100,
    error: "teamMember.name must be between 1 and 100 characters",
  }),
  role: t.String({
    minLength: 1,
    maxLength: 40,
    error: "teamMember.role must be between 1 and 40 characters",
  }),
  email: t.Optional(t.String({ format: "email", maxLength: 254 })),
  imageUrl: t.Optional(t.String({ maxLength: 500 })),
  links: t.Optional(
    t.Object({
      website: t.Optional(t.String({ maxLength: 500 })),
      linkedin: t.Optional(t.String({ maxLength: 500 })),
      github: t.Optional(t.String({ maxLength: 500 })),
    })
  ),
});

export const solutionPillarType = t.Union([
  t.Literal("digital_agriculture"),
  t.Literal("bioeconomy"),
  t.Literal("logistics"),
  t.Literal("education"),
  t.Literal("health"),
  t.Literal("verticalization"),
  t.Literal("default"),
]);

export const teamStatusType = t.Union([
  t.Literal("active"),
  t.Literal("review"),
  t.Literal("rejected"),
]);

export const teamType = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Nullable(t.String()),
  slug: t.String(),
  logoUrl: t.Nullable(t.String()),
  teamMembers: t.Nullable(t.Array(teamMemberType)),
  solutionPillar: solutionPillarType,
  rejectionReason: t.Nullable(t.String()),
  videoUrl: t.Nullable(t.String()),
  secondaryVideoUrl: t.Nullable(t.String()),
  status: teamStatusType,
  createdBy: t.Nullable(t.String()),
  createdAt: t.Date(),
  updatedAt: t.Date(),
});

export const teamAuditLogType = t.Object({
  id: t.String(),
  teamId: t.String(),
  action: t.Union([t.Literal("approved"), t.Literal("rejected")]),
  performedBy: t.String(),
  reason: t.Nullable(t.String()),
  createdAt: t.Date(),
});

export type TeamAuditLog = Static<typeof teamAuditLogType>;

export const createTeamBody = t.Object(
  {
    name: t.String({ minLength: 1, error: "name is required" }),
    description: t.Optional(t.String({ maxLength: 500, error: "description must be at most 500 characters" })),
    teamMembers: t.Optional(t.Array(teamMemberType)),
    videoUrl: t.Optional(t.Nullable(t.String())),
    secondaryVideoUrl: t.Optional(t.Nullable(t.String())),
    slug: t.String({ minLength: 1, error: "slug is required" }),
    status: t.Optional(teamStatusType),
  },
  { additionalProperties: false },
);

export const updateTeamBody = t.Object(
  {
    name: t.Optional(t.String({ minLength: 1, error: "name is required" })),
    description: t.Optional(t.Nullable(t.String({ maxLength: 500, error: "description must be at most 500 characters" }))),
    teamMembers: t.Optional(t.Nullable(t.Array(teamMemberType))),
    videoUrl: t.Optional(t.Nullable(t.String())),
    secondaryVideoUrl: t.Optional(t.Nullable(t.String())),
  },
  { additionalProperties: false },
);

export const createLeaderTeamBody = t.Object(
  {
    name: t.String({ minLength: 1, error: "name is required" }),
    description: t.Optional(t.String({ maxLength: 500, error: "description must be at most 500 characters" })),
    teamMembers: t.Optional(t.Array(teamMemberType, { maxItems: 11 })),
    videoUrl: t.Optional(t.Nullable(t.String())),
    secondaryVideoUrl: t.Optional(t.Nullable(t.String())),
    solutionPillar: t.Optional(solutionPillarType),
    logoUrl: t.Optional(t.Nullable(t.String())),
  },
  { additionalProperties: false },
);

export const updateLeaderTeamBody = t.Object(
  {
    name: t.Optional(t.String({ minLength: 1, error: "name is required" })),
    description: t.Optional(t.Nullable(t.String({ maxLength: 500, error: "description must be at most 500 characters" }))),
    teamMembers: t.Optional(t.Nullable(t.Array(teamMemberType, { maxItems: 11 }))),
    videoUrl: t.Optional(t.Nullable(t.String())),
    secondaryVideoUrl: t.Optional(t.Nullable(t.String())),
    solutionPillar: t.Optional(solutionPillarType),
    logoUrl: t.Optional(t.Nullable(t.String())),
  },
  { additionalProperties: false },
);

export type Team = Static<typeof teamType>;
export type TeamMember = Static<typeof teamMemberType>;
export type SolutionPillar = Static<typeof solutionPillarType>;
export const createAdminTeamBody = t.Object(
  {
    name: t.String({ minLength: 1, error: "name is required" }),
    description: t.Optional(t.String({ maxLength: 500, error: "description must be at most 500 characters" })),
    teamMembers: t.Optional(t.Array(teamMemberType, { maxItems: 11 })),
    videoUrl: t.Optional(t.Nullable(t.String())),
    secondaryVideoUrl: t.Optional(t.Nullable(t.String())),
    solutionPillar: t.Optional(solutionPillarType),
    logoUrl: t.Optional(t.Nullable(t.String())),
    leaderId: t.Optional(t.String({ minLength: 1, error: "leaderId is required" })),
  },
  { additionalProperties: false },
);

export type CreateTeamBody = Static<typeof createTeamBody>;
export type UpdateTeamBody = Static<typeof updateTeamBody>;
export type CreateLeaderTeamBody = Static<typeof createLeaderTeamBody>;
export type UpdateLeaderTeamBody = Static<typeof updateLeaderTeamBody>;
export type CreateAdminTeamBody = Static<typeof createAdminTeamBody>;