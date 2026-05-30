import { t } from "elysia";

import { createController, errorResponse } from "@/shared/infra/base.controller";
import { requireRole } from "@/shared/infra/require-role.middleware";

import { checkSlugUseCase } from "@/teams/applications/check-slug.usecase";
import { createLeaderTeamUseCase } from "@/teams/applications/create-leader-team.usecase";
import { getLeaderTeamUseCase } from "@/teams/applications/get-leader-team.usecase";
import { updateLeaderTeamUseCase } from "@/teams/applications/update-leader-team.usecase";
import { uploadImageInput, uploadImageOutput, uploadImageUseCase } from "@/teams/applications/upload-image.usecase";
import {
  createLeaderTeamBody,
  teamType,
  updateLeaderTeamBody,
} from "@/teams/domain/teams.type";
import { UsersRepository } from "@/users/infra/users.repository";

export const leaderController = createController({ prefix: "/leader", normalize: false })
  .use(requireRole("admin", "leader"))
  .post("/teams", async ({ user, body, set }) => {
    const fullUser = await UsersRepository.findById(user.id);
    const team = await createLeaderTeamUseCase(user.id, fullUser?.teamId ?? null, body);
    set.status = 201;
    return { data: team };
  }, {
    body: createLeaderTeamBody,
    response: {
      201: t.Object({ data: teamType }),
      401: errorResponse,
      403: errorResponse,
      409: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Leader", "Teams"], summary: "Create team (leader only)" },
  })
  .put("/teams", async ({ user, body }) => {
    const fullUser = await UsersRepository.findById(user.id);
    const team = await updateLeaderTeamUseCase(fullUser?.teamId ?? null, body);
    return { data: team };
  }, {
    body: updateLeaderTeamBody,
    response: {
      200: t.Object({ data: teamType }),
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Leader", "Teams"], summary: "Update team (leader only)" },
  })
  .get("/teams", async ({ user }) => {
    const fullUser = await UsersRepository.findById(user.id);
    const team = await getLeaderTeamUseCase(fullUser?.teamId ?? null);
    return { data: team };
  }, {
    response: {
      200: t.Object({ data: teamType }),
      401: errorResponse,
      403: errorResponse,
      404: errorResponse,
    },
    detail: { tags: ["Leader", "Teams"], summary: "Get my team (leader only)" },
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
    detail: { tags: ["Leader", "Images"], summary: "Upload image (leader only)" },
  })
  .get("/teams/check-slug/:slug", async ({ params }) => {
    const result = await checkSlugUseCase(params.slug);
    return { data: result };
  }, {
    params: t.Object({ slug: t.String() }),
    response: {
      200: t.Object({ data: t.Object({ available: t.Boolean() }) }),
      401: errorResponse,
      403: errorResponse,
    },
    detail: { tags: ["Leader", "Teams"], summary: "Check slug availability" },
  });
