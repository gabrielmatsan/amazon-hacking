import { logger } from "@/shared/infra/observability";
import { normalizeEmail } from "@/shared/utils/normalize-email";
import { UsersRepository } from "@/users/infra/users.repository";

import { SessionRepository } from "../infra/session.repository";

interface GoogleCallbackInput {
  googleAccessToken: string;
  ipAddress?: string;
  userAgent?: string;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface GoogleCallbackResult {
  type: "existing_user" | "new_user";
  sid: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  googleUser: GoogleUser;
}

export async function googleCallback({
  googleAccessToken,
  ipAddress,
  userAgent,
}: GoogleCallbackInput): Promise<GoogleCallbackResult> {
  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${googleAccessToken}`,
    },
  });

  if (!userResponse.ok) {
    logger.warn(
      { status: userResponse.status },
      "Google OAuth: failed to fetch userinfo with the provided access token",
    );
    throw new Error("Failed to fetch user information from Google");
  }

  const googleUser: GoogleUser = await userResponse.json();

  const existing = await UsersRepository.findByEmail(googleUser.email);
  const user = existing ??
    (await UsersRepository.create({
      email: googleUser.email,
      normalizedEmail: normalizeEmail(googleUser.email),
      name: googleUser.name,
      role: "user",
    }));

  if (!existing) {
    logger.info(
      { userId: user.id, email: user.email },
      "New user provisioned from Google OAuth sign-in",
    );
  }

  const sid = await SessionRepository.create(
    { id: user.id, email: user.email, role: user.role },
    { ip: ipAddress, ua: userAgent },
  );

  logger.info(
    { userId: user.id, role: user.role, isNewUser: !existing, ipAddress },
    "Google OAuth sign-in succeeded, session created",
  );

  return {
    type: existing ? "existing_user" : "new_user",
    sid,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    googleUser,
  };
}
