import { t } from "elysia";

import { createController, errorResponse } from "@/shared/infra/base.controller";
import { requireRole } from "@/shared/infra/require-role.middleware";

import { getConfigUseCase } from "@/config/applications/get-config.usecase";
import { updateConfigUseCase } from "@/config/applications/update-config.usecase";
import { ForbiddenError } from "@/shared/infra/errors/forbidden-error";
import { approveTeamUseCase } from "@/teams/applications/approve-team.usecase";
import { listTeamsByStatusUseCase } from "@/teams/applications/list-teams-by-status.usecase";
import { rejectTeamUseCase } from "@/teams/applications/reject-team.usecase";
import { uploadImageInput, uploadImageOutput, uploadImageUseCase } from "@/teams/applications/upload-image.usecase";
import { findUserByEmailUseCase } from "@/users/applications/find-user-by-email.usecase";
import { userType } from "@/users/domain/users.type";
import { checkVotesOutput, checkVotesUseCase } from "@/votes/application/check-votes.usecase";
import { flaggedVotesOutput, listFlaggedVotesUseCase } from "@/votes/application/list-flagged-votes.usecase";
import { approveVoteUseCase, invalidateVoteUseCase } from "@/votes/application/moderate-vote.usecase";
import { votesDashboardOutput, votesDashboardUseCase } from "@/votes/application/votes-dashboard.usecase";
import { visitorsAnalyticsOutput, visitorsAnalyticsUseCase } from "@/analytics/application/visitors-analytics.usecase";
import { umamiOverviewOutput, umamiOverviewUseCase, umamiRange } from "@/analytics/application/umami-overview.usecase";
import { umamiRealtimeOutput, umamiRealtimeUseCase } from "@/analytics/application/umami-realtime.usecase";
import {
  sessionDetailOutput,
  sessionsListOutput,
  sessionsListQuery,
  umamiSessionDetailUseCase,
  umamiSessionsListUseCase,
} from "@/analytics/application/umami-sessions.usecase";
import { createAdminTeamUseCase } from "../../teams/applications/create-admin-team.usecase";
import { updateTeamUseCase } from "../../teams/applications/update-team.usecase";
import { createAdminTeamBody, teamAuditLogType, teamType, updateTeamBody } from "../../teams/domain/teams.type";
import { TeamAuditLogsRepository } from "../../teams/infra/team-audit-logs.repository";

export const adminController = createController({ prefix: "/admin", normalize: false })
  .use(requireRole("admin"))
  .post("/teams", async ({ body, set, user }) => {
    const team = await createAdminTeamUseCase(body, user.id);
    set.status = 201;
    return { data: team };
  }, {
    body: createAdminTeamBody,
    response: {
      201: t.Object({ data: teamType }),
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
      409: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Admin", "Teams"], summary: "Create team with leader association (admin only)" },
  })
  .put("/teams/:id", async ({ params, body }) => {
    const team = await updateTeamUseCase(params.id, body);
    return { data: team };
  }, {
    params: t.Object({ id: t.String() }),
    body: updateTeamBody,
    response: {
      200: t.Object({ data: teamType }),
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Admin", "Teams"], summary: "Update team (admin only)" },
  })
  .post("/images", async ({ body }) => {
    const image = await uploadImageUseCase(body);

    return { data: image };
  }, {
    body: uploadImageInput,
    response: {
      200: t.Object({ data: uploadImageOutput }),
      400: errorResponse,
      401: errorResponse,
      403: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Admin", "Images"], summary: "Upload image (admin only)" },
  })
  .get("/teams/review", async () => {
    const teams = await listTeamsByStatusUseCase("review");
    return { data: teams };
  }, {
    response: {
      200: t.Object({ data: t.Array(teamType) }),
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Admin", "Teams"], summary: "List teams in review (admin only)" },
  })
  .put("/teams/:id/approve", async ({ params, user }) => {
    const team = await approveTeamUseCase(params.id, user.id);
    return { data: team };
  }, {
    params: t.Object({ id: t.String() }),
    response: {
      200: t.Object({ data: teamType }),
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
    },
    detail: { tags: ["Admin", "Teams"], summary: "Approve team (admin only)" },
  })
  .put("/teams/:id/reject", async ({ params, body, user }) => {
    const team = await rejectTeamUseCase(params.id, body.reason, user.id);
    return { data: team };
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({ reason: t.String({ minLength: 1, error: "reason is required" }) }),
    response: {
      200: t.Object({ data: teamType }),
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Admin", "Teams"], summary: "Reject team (admin only)" },
  })
  .get("/teams/:id/audit-logs", async ({ params }) => {
    const logs = await TeamAuditLogsRepository.findByTeamId(params.id);
    return { data: logs };
  }, {
    params: t.Object({ id: t.String() }),
    response: {
      200: t.Object({ data: t.Array(teamAuditLogType) }),
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Admin", "Teams"], summary: "List team audit logs (admin only)" },
  })
  .get("/votes/count", async () => {
    const votes = await checkVotesUseCase();
    return { data: votes };
  }, {
    response: {
      200: t.Object({ data: checkVotesOutput }),
    },
    detail: { tags: ["Admin", "Votes"], summary: "Check votes (admin only)" },
  })
  .get("/votes/dashboard", async () => {
    const dashboard = await votesDashboardUseCase();
    return { data: dashboard };
  }, {
    response: {
      200: t.Object({ data: votesDashboardOutput }),
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Admin", "Votes"], summary: "Votes dashboard (admin only)" },
  })
  .get("/analytics/visitors", async () => {
    const analytics = await visitorsAnalyticsUseCase();
    return { data: analytics };
  }, {
    response: {
      200: t.Object({ data: visitorsAnalyticsOutput }),
      400: errorResponse,
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Admin", "Analytics"], summary: "Cloudflare unique visitors (admin only)" },
  })
  .get("/analytics/umami/overview", async ({ query }) => {
    const overview = await umamiOverviewUseCase(query.range ?? "7d");
    return { data: overview };
  }, {
    query: t.Object({ range: t.Optional(umamiRange) }),
    response: {
      200: t.Object({ data: umamiOverviewOutput }),
      400: errorResponse,
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Admin", "Analytics"], summary: "Umami overview (admin only)" },
  })
  .get("/analytics/umami/realtime", async () => {
    const realtime = await umamiRealtimeUseCase();
    return { data: realtime };
  }, {
    response: {
      200: t.Object({ data: umamiRealtimeOutput }),
      400: errorResponse,
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Admin", "Analytics"], summary: "Umami realtime active visitors (admin only)" },
  })
  .get("/analytics/umami/sessions", async ({ query }) => {
    const sessions = await umamiSessionsListUseCase(
      query.range ?? "7d",
      query.page ?? 1,
      query.search,
    );
    return { data: sessions };
  }, {
    query: sessionsListQuery,
    response: {
      200: t.Object({ data: sessionsListOutput }),
      400: errorResponse,
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Admin", "Analytics"], summary: "Umami sessions list (admin only)" },
  })
  .get("/analytics/umami/sessions/:sessionId", async ({ params, query }) => {
    const detail = await umamiSessionDetailUseCase(params.sessionId, query.range ?? "7d");
    return { data: detail };
  }, {
    params: t.Object({ sessionId: t.String() }),
    query: t.Object({ range: t.Optional(umamiRange) }),
    response: {
      200: t.Object({ data: sessionDetailOutput }),
      400: errorResponse,
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Admin", "Analytics"], summary: "Umami session detail (admin only)" },
  })
  .get("/votes/flagged", async ({ query }) => {
    const data = await listFlaggedVotesUseCase(
      query.cursor ?? undefined,
      query.limit ? Number(query.limit) : 10,
    );
    return { data };
  }, {
    query: t.Object({
      cursor: t.Optional(t.String()),
      limit: t.Optional(t.String()),
    }),
    response: {
      200: t.Object({ data: flaggedVotesOutput }),
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Admin", "Votes"], summary: "List flagged votes with cursor pagination" },
  })
  .put("/votes/:id/approve", async ({ params }) => {
    const vote = await approveVoteUseCase(params.id);
    return { data: { id: vote.id, status: vote.status } };
  }, {
    params: t.Object({ id: t.String() }),
    response: {
      200: t.Object({ data: t.Object({ id: t.String(), status: t.String() }) }),
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
    },
    detail: { tags: ["Admin", "Votes"], summary: "Approve a flagged vote" },
  })
  .put("/votes/:id/invalidate", async ({ params }) => {
    const vote = await invalidateVoteUseCase(params.id);
    return { data: { id: vote.id, status: vote.status } };
  }, {
    params: t.Object({ id: t.String() }),
    response: {
      200: t.Object({ data: t.Object({ id: t.String(), status: t.String() }) }),
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
    },
    detail: { tags: ["Admin", "Votes"], summary: "Invalidate a flagged vote" },
  })
  .get("/config", async () => {
    const config = await getConfigUseCase();
    return { data: config };
  }, {
    response: {
      200: t.Object({
        data: t.Object({
          id: t.Nullable(t.String()),
          votingStartsAt: t.Nullable(t.Date()),
          votingEndsAt: t.Nullable(t.Date()),
          votingEnabled: t.Boolean(),
          maxRiskScore: t.Number(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        }),
      }),
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Admin", "Config"], summary: "Get app configuration" },
  })
  .put("/config", async ({ body }) => {
    const config = await updateConfigUseCase(body);
    return { data: config };
  }, {
    body: t.Object({
      votingStartsAt: t.Nullable(t.String()),
      votingEndsAt: t.Nullable(t.String()),
      votingEnabled: t.Boolean(),
      maxRiskScore: t.Number({ minimum: 0, maximum: 100 }),
    }),
    response: {
      200: t.Object({
        data: t.Object({
          id: t.String(),
          votingStartsAt: t.Nullable(t.Date()),
          votingEndsAt: t.Nullable(t.Date()),
          votingEnabled: t.Boolean(),
          maxRiskScore: t.Number(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        }),
      }),
      401: errorResponse,
      403: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Admin", "Config"], summary: "Update app configuration" },
  })
  .get("/user/email/:email", async ({ set, request, params, validateToken }) => {
    const user = await validateToken(request);

    if (user.role !== "admin") {
      throw new ForbiddenError("Admin role required");
    }

    const users = await findUserByEmailUseCase(params.email);
    return { data: users };
  }, {
    response: {
      200: t.Object({ data: t.Array(userType) }),
    },
    params: t.Object({ email: t.String() }),

    detail: { tags: ["Admin", "Users"], summary: "List users" },
  });
