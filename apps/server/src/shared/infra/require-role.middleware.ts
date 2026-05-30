import Elysia from "elysia";

import { authMiddleware, type AuthUser } from "./auth.middleware";
import { ForbiddenError } from "./errors/forbidden-error";
import { logger } from "./observability";

export function requireRole(...roles: string[]) {
  return new Elysia({
    name: `requireRole:${roles.join(",")}`,
    seed: { value: `service.requireRole:${roles.join(",")}` },
  })
    .use(authMiddleware)
    .derive({ as: "scoped" }, async ({ request, validateToken }): Promise<{ user: AuthUser }> => {
      const user = await validateToken(request);
      logger.info({ user }, "Validating role");
      if (!roles.includes(user.role)) {
        logger.warn({ user, roleRequired: roles.join(" or "), userRole: user.role }, "Role not allowed");
        throw new ForbiddenError(`Role required: ${roles.join(" or ")}`);
      }
      return { user };
    });
}
