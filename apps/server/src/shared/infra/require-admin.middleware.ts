import Elysia from "elysia";

import { authMiddleware, type AuthUser } from "./auth.middleware";
import { ForbiddenError } from "./errors/forbidden-error";

export const requireAdmin = new Elysia({
  name: "requireAdmin",
  seed: { value: "service.requireAdmin" },
})
  .use(authMiddleware)
  .derive({ as: "scoped" }, async ({ request, validateToken }): Promise<{ user: AuthUser }> => {
    const user = await validateToken(request);
    if (user.role !== "admin") {
      throw new ForbiddenError("Admin role required");
    }
    return { user };
  });
