import Elysia from "elysia";

import { authMiddleware, type AuthUser } from "./auth.middleware";
import { ForbiddenError } from "./errors/forbidden-error";

export function requireRole(...roles: string[]) {
  return new Elysia({
    name: `requireRole:${roles.join(",")}`,
    seed: { value: `service.requireRole:${roles.join(",")}` },
  })
    .use(authMiddleware)
    .derive({ as: "scoped" }, async ({ request, validateToken }): Promise<{ user: AuthUser }> => {
      const user = await validateToken(request);
      if (!roles.includes(user.role)) {
        throw new ForbiddenError(`Role required: ${roles.join(" or ")}`);
      }
      return { user };
    });
}
