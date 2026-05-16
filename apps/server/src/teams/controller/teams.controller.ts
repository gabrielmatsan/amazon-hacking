import { t } from "elysia";

import { errorResponse } from "@/shared/infra/base.controller";
import { createController } from "@/shared/infra/base.controller";

import { getTeam, teamDetailSchema } from "../applications/get-team.usecase";
import { listTeams, teamListItemSchema } from "../applications/list-teams.usecase";

export const teamsController = createController({ prefix: "/teams" })
  .get("/", async () => {
    const data = await listTeams();
    return { data };
  }, {
    response: {
      200: t.Object({ data: t.Array(teamListItemSchema) }),
    },
    detail: { tags: ["Teams"], summary: "List teams (public fields only)" },
  })
  .get("/:id", async ({ params }) => {
    const team = await getTeam(params.id);
    return { data: team };
  }, {
    params: t.Object({ id: t.String() }),
    response: {
      200: t.Object({ data: teamDetailSchema }),
      404: errorResponse,
    },
    detail: { tags: ["Teams"], summary: "Get team detail by id" },
  });
