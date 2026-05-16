import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../infra/jwt.service";
import { RefreshTokenRepository } from "../infra/refresh.repository";
import { UsersRepository } from "@/users/infra/users.repository";

export async function refreshUseCase(refreshToken: string) {
  const payload = await verifyRefreshToken(refreshToken);

  if (!payload) throw new UnauthorizedError("Invalid or expired refresh token");

  if (!payload.jti) throw new UnauthorizedError("Invalid or expired refresh token");

  const consumed = await RefreshTokenRepository.consume(payload.sub, payload.jti, refreshToken);
  if (!consumed) throw new UnauthorizedError("Invalid or expired refresh token");


  const user = await UsersRepository.findById(payload.sub);
  if (!user) throw new UnauthorizedError("User not found");

  const newPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const [accessToken, { token: newRefreshToken, jti: newJti }] = await Promise.all([
    signAccessToken(newPayload),
    signRefreshToken(newPayload),
  ]);

  await RefreshTokenRepository.set(payload.sub, newJti, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}