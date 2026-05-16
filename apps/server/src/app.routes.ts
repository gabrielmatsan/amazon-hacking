import Elysia from "elysia";
import { teamsController } from "./teams/controller/teams.controller";

export const appRoutes = new Elysia({ normalize: "typebox" })
  .use(teamsController);
