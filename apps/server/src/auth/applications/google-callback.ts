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
    throw new Error("Failed to fetch user information from Google");
  }

  const googleUser: GoogleUser = await userResponse.json();

  const existing = await UsersRepository.findByEmail(googleUser.email);
  const user = existing ??
    (await UsersRepository.create({
      email: googleUser.email,
      name: googleUser.name,
      role: "user",
    }));

  const sid = await SessionRepository.create(
    { id: user.id, email: user.email, role: user.role },
    { ip: ipAddress, ua: userAgent },
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
