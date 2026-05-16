import { env } from "@/shared/infra/env/env";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import type { UserRole } from "@/users/domain/users.type";
import { randomUUID } from "crypto";
import { SignJWT, jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const REFRESH_SECRET = new TextEncoder().encode(env.JWT_REFRESH_SECRET);

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  jti?: string;
}

export async function signAccessToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(ACCESS_SECRET);
}

export async function signRefreshToken(payload: JwtPayload): Promise<{ token: string; jti: string }> {
  const jti = randomUUID();
  const token = await new SignJWT({ email: payload.email, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setJti(jti)
    .setExpirationTime("7d")
    .sign(REFRESH_SECRET);
  return { token, jti };
}

export async function verifyAccessToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as UserRole,
  };
}

export async function verifyRefreshToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return {
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as UserRole,
    jti: payload.jti as string | undefined,
  };
}

export function getTokenFromCookies(request: Request, cookieName: string): string | undefined {
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

export async function validateAccessToken(request: Request): Promise<JwtPayload> {
  const accessToken = getTokenFromCookies(request, "access_token");
  if (!accessToken) throw new UnauthorizedError("Access token not found");

  return verifyAccessToken(accessToken);
}

export async function getOptionalAccessTokenPayload(
  request: Request
): Promise<JwtPayload | null> {
  const accessToken = getTokenFromCookies(request, "access_token");
  if (!accessToken) return null;

  try {
    return await verifyAccessToken(accessToken);
  } catch {
    return null;
  }
}