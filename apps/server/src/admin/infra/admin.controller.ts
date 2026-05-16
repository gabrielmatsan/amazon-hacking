import { t } from "elysia";

import { createController, errorResponse } from "@/shared/infra/base.controller";
import { requireAdmin } from "@/shared/infra/require-admin.middleware";

import { createTeamUseCase } from "../../teams/applications/create-team.usecase";
import { updateTeamUseCase } from "../../teams/applications/update-team.usecase";
import { uploadTeamLogoUseCase } from "../../teams/applications/upload-team-logo.usecase";
import { createTeamBody, teamType, updateTeamBody } from "../../teams/domain/teams.type";

export const adminController = createController({ prefix: "/admin", normalize: false })
  .use(requireAdmin)
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
  .post("/teams/:id/logo", async ({ params, body }) => {
    const file = body.logo;
    const buffer = Buffer.from(await file.arrayBuffer());

    return uploadTeamLogoUseCase({
      teamId: params.id,
      file: {
        buffer,
        contentType: file.type,
        size: file.size,
      },
    });
  }, {
    params: t.Object({ id: t.String() }),
    body: t.Object({ logo: t.File() }),
    type: "multipart/form-data",
    response: {
      200: t.Object({ logoUrl: t.String() }),
      400: errorResponse,
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Admin", "Teams"], summary: "Upload team logo (admin only)" },
  });
