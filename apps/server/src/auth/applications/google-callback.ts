import { UsersRepository } from "@/users/infra/users.repository";
import { signAccessToken, signRefreshToken } from "../infra/jwt.service";
import { RefreshTokenRepository } from "../infra/refresh.repository";

interface googleCallbackInput {
  accessToken: string;
}

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}


export interface GoogleCallbackResult {
  type: 'existing_user' | 'new_user';
  accessToken: string;
  refreshToken: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
  googleUser: GoogleUser;
}

export async function googleCallback({ accessToken }: googleCallbackInput): Promise<GoogleCallbackResult> {

  const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });


  if (!userResponse.ok) {
    throw new Error("Failed to fetch user information from Google");
  }

  const googleUser: GoogleUser = await userResponse.json();

  const existing = await UsersRepository.findByEmail(googleUser.email);

  if (existing) {
    const [userAccessToken, { token: userRefreshToken, jti }] = await Promise.all([
      signAccessToken({
        sub: existing.id,
        email: existing.email,
        role: existing.role,
      }),
      signRefreshToken({
        sub: existing.id,
        email: existing.email,
        role: existing.role,
      }),
    ]);
    await RefreshTokenRepository.set(existing.id, jti, userRefreshToken);

    return {
      type: "existing_user",
      accessToken: userAccessToken,
      refreshToken: userRefreshToken,
      user: {
        id: existing.id,
        email: existing.email,
        name: existing.name,
      },
      googleUser,
    }
  }

  const newUser = await UsersRepository.create({
    email: googleUser.email,
    name: googleUser.name,
    role: "user",
  });


  const [userAccessToken, { token: userRefreshToken, jti }] = await Promise.all([
    signAccessToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    }),
    signRefreshToken({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    }),
  ]);

  await RefreshTokenRepository.set(newUser.id, jti, userRefreshToken);

  return {
    type: "new_user",
    accessToken: userAccessToken,
    refreshToken: userRefreshToken,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    },
    googleUser,
  }
}