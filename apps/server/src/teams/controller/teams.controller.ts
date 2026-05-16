import { t } from "elysia";

import { createController, errorResponse } from "@/shared/infra/base.controller";

import { getTeam } from "../applications/get-team.usecase";
import { listTeams, teamListItemSchema } from "../applications/list-teams.usecase";
import { teamType } from "../domain/teams.type";

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
      200: t.Object({ data: teamType }),
      404: errorResponse,
    },
    detail: { tags: ["Teams"], summary: "Get team detail by id" },
  });
