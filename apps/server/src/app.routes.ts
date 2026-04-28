import Elysia from "elysia";
import { itemsController } from "./items/controller/items.controller";

export const appRoutes = new Elysia()
  .use(itemsController);
