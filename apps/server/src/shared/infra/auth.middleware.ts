import { Elysia } from "elysia";
import * as jose from "jose";

import { env } from "./env/env";
import { UnauthorizedError } from "./errors/unauthorized-error";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

function getTokenFromCookies(request: Request, cookieName: string): string | undefined {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return undefined;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, string>
  );

  return cookies[cookieName];
}

const jwtSecret = new TextEncoder().encode(env.JWT_SECRET);

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
  .derive({ as: "global" }, () => {
    return {
      validateToken: async (request: Request): Promise<AuthUser> => {
        const authHeader = request.headers.get("authorization");

        const token =
          authHeader?.replace("Bearer ", "") ||
          getTokenFromCookies(request, "access_token");

        if (!token) {
          throw new UnauthorizedError("Token not found");
        }

        try {
          const { payload } = await jose.jwtVerify(token, jwtSecret);

          if (!payload.sub) {
            throw new UnauthorizedError();
          }

          return {
            id: payload.sub,
            email: payload.email as string,
            role: payload.role as string || "user",
          };
        } catch (error) {
          if (error instanceof UnauthorizedError) throw error;
          throw new UnauthorizedError();
        }
      },

      validateXApiToken: async (request: Request): Promise<Boolean> => {

        const xApiToken = request.headers.get("x-api-token");

        if (!xApiToken) throw new UnauthorizedError("Unathorized");


        if (xApiToken !== env.X_API_TOKEN) throw new UnauthorizedError("Invalid API token");

        return true;
      },
    };
  });
