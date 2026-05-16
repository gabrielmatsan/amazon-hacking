import Elysia from "elysia";

import { authController } from "./auth/controller/auth.controller";
import { teamsController } from "./teams/controller/teams.controller";

export const appRoutes = new Elysia({ normalize: "typebox", prefix: "/v1" })
  .use(teamsController)
  .use(authController);
