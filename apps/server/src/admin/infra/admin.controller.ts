import { t } from "elysia";

import { createController, errorResponse } from "@/shared/infra/base.controller";
import { requireRole } from "@/shared/infra/require-role.middleware";

import { getConfigUseCase } from "@/config/applications/get-config.usecase";
import { updateConfigUseCase } from "@/config/applications/update-config.usecase";
import { approveTeamUseCase } from "@/teams/applications/approve-team.usecase";
import { listTeamsByStatusUseCase } from "@/teams/applications/list-teams-by-status.usecase";
import { rejectTeamUseCase } from "@/teams/applications/reject-team.usecase";
import { uploadImageInput, uploadImageOutput, uploadImageUseCase } from "@/teams/applications/upload-image.usecase";
import { checkVotesOutput, checkVotesUseCase } from "@/votes/application/check-votes.usecase";
import { flaggedVotesOutput, listFlaggedVotesUseCase } from "@/votes/application/list-flagged-votes.usecase";
import { approveVoteUseCase, invalidateVoteUseCase } from "@/votes/application/moderate-vote.usecase";
import { votesDashboardOutput, votesDashboardUseCase } from "@/votes/application/votes-dashboard.usecase";
import { createTeamUseCase } from "../../teams/applications/create-team.usecase";
import { updateTeamUseCase } from "../../teams/applications/update-team.usecase";
import { createTeamBody, teamType, updateTeamBody } from "../../teams/domain/teams.type";

export const adminController = createController({ prefix: "/admin", normalize: false })
  .use(requireRole("admin"))
  .post("/teams", async ({ body, set }) => {
    const team = await createTeamUseCase(body);
    set.status = 201;
    return { data: team };
  }, {
    body: createTeamBody,
    response: {
      201: t.Object({ data: teamType }),
      401: errorResponse,
      403: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Admin", "Teams"], summary: "Create team (admin only)" },
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
  .put("/teams/:id/approve", async ({ params }) => {
    const team = await approveTeamUseCase(params.id);
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
  .put("/teams/:id/reject", async ({ params, body }) => {
    const team = await rejectTeamUseCase(params.id, body.reason);
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
    }),
    response: {
      200: t.Object({
        data: t.Object({
          id: t.String(),
          votingStartsAt: t.Nullable(t.Date()),
          votingEndsAt: t.Nullable(t.Date()),
          votingEnabled: t.Boolean(),
          createdAt: t.Date(),
          updatedAt: t.Date(),
        }),
      }),
      401: errorResponse,
      403: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Admin", "Config"], summary: "Update app configuration" },
  });
