import cookie from "@elysiajs/cookie";
import Elysia, { t } from "elysia";

import { authMiddleware } from "./auth.middleware";
import { globalErrorHandler } from "./errors/global-error-handler";
import { httpMiddleware } from "./http.middleware";

export const errorResponse = t.Object({
  error: t.Literal("failed"),
  message: t.String(),
});

export const createController = (options?: ConstructorParameters<typeof Elysia>[0]) =>
  new Elysia({ normalize: "typebox", ...options })
    .onError(({ error, set }) => {
      const { message, code } = globalErrorHandler(error);

      set.status = code;
      return {
        error: "failed",
        message
      };
    })
    .use(authMiddleware)
    .use(httpMiddleware)
    .use(cookie());
