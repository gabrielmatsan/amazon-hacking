import { t } from "elysia";

import { createController, errorResponse } from "@/shared/infra/base.controller";

import { getTeamBySlug } from "../applications/get-team-by-slug.usecase";
import { getTeam } from "../applications/get-team.usecase";
import { listTeams, teamListGroupSchema } from "../applications/list-teams.usecase";
import { searchTeams, teamSearchItemSchema } from "../applications/search-teams.usecase";
import { teamType } from "../domain/teams.type";
import { liveViewersOutput, liveViewersUseCase } from "@/analytics/application/live-viewers.usecase";

export const teamsController = createController({ prefix: "/teams" })
  .get("/live-viewers", async () => {
    const data = await liveViewersUseCase();
    return { data };
  }, {
    response: {
      200: t.Object({ data: liveViewersOutput }),
    },
    detail: { tags: ["Teams", "Analytics"], summary: "Live viewers per solution (public)" },
  })
  .get("/", async () => {
    const data = await listTeams();
    return { data };
  }, {
    response: {
      200: t.Object({ data: t.Array(teamListGroupSchema) }),
    },
    detail: { tags: ["Teams"], summary: "List teams (public fields only)" },
  })
  .get("/search", async ({ query }) => {
    const data = await searchTeams(query.q, query.limit);
    return { data };
  }, {
    query: t.Object({
      q: t.String({ description: "Termo de busca" }),
      limit: t.Optional(t.Numeric({ minimum: 1, maximum: 50 })),
    }),
    response: {
      200: t.Object({ data: t.Array(teamSearchItemSchema) }),
    },
    detail: { tags: ["Teams"], summary: "Search active teams by relevance (FTS + trigram)" },
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
