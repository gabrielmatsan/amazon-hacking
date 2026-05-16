import { oauth2 } from "elysia-oauth2";

import { createController } from "@/shared/infra/base.controller";
import { env } from "@/shared/infra/env/env";
import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { getCookieDomain } from "@/shared/utils/get-cookie-domain";
import { UsersRepository } from "@/users/infra/users.repository";
import { t } from "elysia";
import { googleCallback } from "../applications/google-callback";
import { logoutUseCase } from "../applications/logout.usecase";
import { refreshUseCase } from "../applications/refresh.usecase";
import { verifyAccessToken } from "../infra/jwt.service";

const isProduction = env.NODE_ENV === "production";
const cookieDomain = getCookieDomain();
const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15 minutes in seconds
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  domain: cookieDomain,
  path: "/",
};

type TokenCookies = {
  access_token: { set: (opts: Record<string, unknown>) => void };
  refresh_token: { set: (opts: Record<string, unknown>) => void };
};

function setTokenCookies(
  cookies: TokenCookies,
  tokens: { accessToken: string; refreshToken: string },
) {
  cookies.access_token.set({
    ...cookieOptions,
    value: tokens.accessToken,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  cookies.refresh_token.set({
    ...cookieOptions,
    value: tokens.refreshToken,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

function clearTokenCookies(cookies: TokenCookies) {
  cookies.access_token.set({ ...cookieOptions, value: "", maxAge: 0 });
  cookies.refresh_token.set({ ...cookieOptions, value: "", maxAge: 0 });
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

    console.log("url", url.href);
    return redirect(url.href);
  })
  .get("/google/callback", async ({ oauth2, set, cookie: { access_token, refresh_token }, redirect }) => {
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

      result = await googleCallback({ googleAccessToken });
    }
    catch {
      set.status = 400;
      return { error: "failed", message: "Invalid OAuth state" };
    }

    setTokenCookies({ access_token, refresh_token }, { accessToken: result.accessToken, refreshToken: result.refreshToken });

    return redirect(env.FRONTEND_URL);
  }, {
    cookie: t.Cookie({
      access_token: t.Optional(t.String()),
      refresh_token: t.Optional(t.String()),
    }),
    detail: {
      description: "Google callback endpoint",
      tags: ["Auth"],
    },
  })
  .post(
    "/refresh",
    async ({ cookie: { access_token, refresh_token } }) => {
      const currentRefreshToken = refresh_token.value;

      if (!currentRefreshToken) throw new UnauthorizedError("Refresh token não encontrado");

      const { accessToken, refreshToken } = await refreshUseCase(currentRefreshToken);

      setTokenCookies({ access_token, refresh_token }, { accessToken, refreshToken });

      return { message: "Tokens renovados com sucesso" };
    },
    {
      detail: {
        description: "Refresh access and refresh tokens using the refresh token cookie",
        tags: ["Auth"],
      },
      cookie: t.Cookie({
        refresh_token: t.Optional(t.String()),
      }),
    }
  )
  .post(
    "/logout",
    async ({ cookie: { access_token, refresh_token } }) => {
      await logoutUseCase(refresh_token.value);

      clearTokenCookies({ access_token, refresh_token });

      return { message: "Session closed successfully" };
    },
    {
      detail: {
        description: "Logout and invalidate session",
        tags: ["Auth"],
      },
      cookie: t.Cookie({
        access_token: t.Optional(t.String()),
        refresh_token: t.Optional(t.String()),
      }),
    }
  )
  .get(
    "/me",
    async ({ cookie: { access_token } }) => {
      if (!access_token.value) {
        throw new UnauthorizedError("Access token not found");
      }

      const { sub } = await verifyAccessToken(access_token.value);
      if (!sub) throw new UnauthorizedError("Invalid access token");


      const user = await UsersRepository.findById(sub);
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
        access_token: t.Optional(t.String()),
      }),
      detail: {
        description: "Get the current user's session",
        tags: ["Auth"],
      },
    }
  )
