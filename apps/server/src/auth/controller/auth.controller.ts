import { oauth2 } from "elysia-oauth2";
import { t } from "elysia";

import { createController } from "@/shared/infra/base.controller";
import { env } from "@/shared/infra/env/env";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { getCookieDomain } from "@/shared/utils/get-cookie-domain";
import { UsersRepository } from "@/users/infra/users.repository";

import { googleCallback } from "../applications/google-callback";
import { logoutAllUseCase } from "../applications/logout-all.usecase";
import { logoutUseCase } from "../applications/logout.usecase";

const isProduction = env.NODE_ENV === "production";
const cookieDomain = getCookieDomain();
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  domain: cookieDomain,
  path: "/",
};

type SessionCookie = { set: (opts: Record<string, unknown>) => void };

function setSessionCookie(cookie: SessionCookie, sid: string) {
  cookie.set({ ...cookieOptions, value: sid, maxAge: SESSION_MAX_AGE });
}

function clearSessionCookie(cookie: SessionCookie) {
  cookie.set({ ...cookieOptions, value: "", maxAge: 0 });
}

function getIp(request: Request): string | undefined {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined
  );
}

export const authController = createController({ prefix: "/auth" })
  .use(
    oauth2({
      Google: [
        env.GOOGLE_CLIENT_ID,
        env.GOOGLE_CLIENT_SECRET,
        env.GOOGLE_REDIRECT_URI,
      ],
    }, {
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 600,
        secure: env.NODE_ENV === "production",
      },
    }),
  )
  .get("/google/login", ({ oauth2, query, cookie, redirect }) => {
    const url = oauth2.createURL("Google", ["openid", "email", "profile"]);

    const returnTo = typeof query.returnTo === "string" ? query.returnTo : "/";

    cookie.oauth_return_to.set({
      value: returnTo,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 600,
      secure: env.NODE_ENV === "production",
    });

    return redirect(url.href);
  })
  .get(
    "/google/callback",
    async ({ oauth2, set, cookie: { session_id }, redirect, request }) => {
      let result: Awaited<ReturnType<typeof googleCallback>>;

      try {
        const oauthToken = await oauth2.authorize("Google");
        const googleAccessToken = oauthToken.accessToken();

        if (!googleAccessToken) {
          set.status = 400;
          return {
            error: "failed",
            message: "Failed to obtain access token",
          };
        }

        result = await googleCallback({
          googleAccessToken,
          ipAddress: getIp(request),
          userAgent: request.headers.get("user-agent") ?? undefined,
        });
      }
      catch {
        set.status = 400;
        return { error: "failed", message: "Invalid OAuth state" };
      }

      setSessionCookie(session_id, result.sid);

      return redirect(env.FRONTEND_URL);
    },
    {
      cookie: t.Cookie({
        session_id: t.Optional(t.String()),
      }),
      detail: {
        description: "Google callback endpoint",
        tags: ["Auth"],
      },
    },
  )
  .post(
    "/logout",
    async ({ cookie: { session_id } }) => {
      await logoutUseCase(session_id.value);
      clearSessionCookie(session_id);
      return { message: "Session closed successfully" };
    },
    {
      detail: {
        description: "Logout and invalidate the current session",
        tags: ["Auth"],
      },
      cookie: t.Cookie({
        session_id: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/logout-all",
    async ({ cookie: { session_id }, request, validateToken }) => {
      const user = await validateToken(request);
      const revoked = await logoutAllUseCase(user.id);
      clearSessionCookie(session_id);
      return { message: "All sessions revoked", revoked };
    },
    {
      detail: {
        description: "Revoke every active session for the current user",
        tags: ["Auth"],
      },
      cookie: t.Cookie({
        session_id: t.Optional(t.String()),
      }),
    },
  )
  .get(
    "/me",
    async ({ request, validateToken }) => {
      const auth = await validateToken(request);

      const user = await UsersRepository.findById(auth.id);
      if (!user) throw new NotFoundError("User not found");

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      };
    },
    {
      cookie: t.Cookie({
        session_id: t.Optional(t.String()),
      }),
      detail: {
        description: "Get the current user's session",
        tags: ["Auth"],
      },
    },
  );
