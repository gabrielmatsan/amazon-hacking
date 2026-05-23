import Elysia from "elysia";

import { adminController } from "./admin/infra/admin.controller";
import { authController } from "./auth/controller/auth.controller";
import { teamsController } from "./teams/controller/teams.controller";
import { votesController } from "./votes/infra/votes.controller";
import { votesTokensController } from "./votes-token/infra/votes-tokens.controller";

export const appRoutes = new Elysia({ normalize: "typebox", prefix: "/v1" })
  .use(teamsController)
  .use(adminController)
  .use(authController)
  .use(votesController)
  .use(votesTokensController);
