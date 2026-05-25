import { t } from "elysia";

import { createController, errorResponse } from "@/shared/infra/base.controller";

import { getTeamBySlug } from "../applications/get-team-by-slug.usecase";
import { getTeam } from "../applications/get-team.usecase";
import { listTeams, teamListGroupSchema } from "../applications/list-teams.usecase";
import { teamType } from "../domain/teams.type";

export const teamsController = createController({ prefix: "/teams" })
  .get("/", async () => {
    const data = await listTeams();
    return { data };
  }, {
    response: {
      200: t.Object({ data: t.Array(teamListGroupSchema) }),
    },
    detail: { tags: ["Teams"], summary: "List teams (public fields only)" },
  })
  .get("/id/:id", async ({ params }) => {
    const team = await getTeam(params.id);
    return { data: team };
  }, {
    params: t.Object({ id: t.String() }),
    response: {
      200: t.Object({ data: teamType }),
      404: errorResponse,
    },
    detail: { tags: ["Teams"], summary: "Get team detail by id" },
  })
  .get("/slug/:slug", async ({ params }) => {
    const team = await getTeamBySlug(params.slug);
    return { data: team };
  }, {
    params: t.Object({ slug: t.String() }),
    response: {
      200: t.Object({ data: teamType }),
      404: errorResponse,
    },
    detail: { tags: ["Teams"], summary: "Get team detail by slug" },
  });
