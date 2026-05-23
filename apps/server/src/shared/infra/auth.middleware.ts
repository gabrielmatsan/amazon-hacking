import { Elysia } from "elysia";

import { SessionRepository } from "@/auth/infra/session.repository";

import { env } from "./env/env";
import { UnauthorizedError } from "./errors/unauthorized-error";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    if (trimmed.slice(0, eqIdx) !== name) continue;
    return trimmed.slice(eqIdx + 1);
  }
  return undefined;
}

export const authMiddleware = new Elysia({
  name: "authMiddleware",
  seed: { value: "service.authMiddleware" },
})
  .error({ UNAUTHORIZED: UnauthorizedError })
  .onError(({ code, error, set }) => {
    switch (code) {
      case "UNAUTHORIZED":
        set.status = 401;
        return {
          code,
          message: error.message,
        };
    }
  })
  .macro({
    requireApiToken: {
      resolve: ({ request }) => {
        const token = request.headers.get("x-api-token");
        if (!token || token !== env.X_API_TOKEN) {
          throw new UnauthorizedError("Invalid API token");
        }
      },
    },
  })
  .derive({ as: "global" }, () => {
    return {
      validateToken: async (request: Request): Promise<AuthUser> => {
        const sid = getCookie(request, "session_id");
        if (!sid) throw new UnauthorizedError("Session not found");

        const session = await SessionRepository.get(sid);
        if (!session) throw new UnauthorizedError("Invalid session");

        void SessionRepository.touch(sid).catch(() => {
          console.error("Error renewing session TTL", { sid });
          // se der erro, nao vai dar problema, apenas nao vai renovar o TTL
        });

        return {
          id: session.userId,
          email: session.email,
          role: session.role,
        };
      },
    };
  });
