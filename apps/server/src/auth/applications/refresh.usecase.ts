import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../infra/jwt.service";
import { RefreshTokenRepository } from "../infra/refresh.repository";

export async function refreshUseCase(refreshToken: string) {
  const payload = await verifyRefreshToken(refreshToken);

  if (!payload) throw new UnauthorizedError("Invalid or expired refresh token");

  if (!payload.jti) throw new UnauthorizedError("Invalid or expired refresh token");

  const consumed = await RefreshTokenRepository.consume(payload.sub, payload.jti, refreshToken);
  if (!consumed) throw new UnauthorizedError("Invalid or expired refresh token");

  const newPayload = {
    sub: payload.sub,
    email: payload.email,
    role: payload.role,
  };

  const [accessToken, { token: newRefreshToken, jti: newJti }] = await Promise.all([
    signAccessToken(newPayload),
    signRefreshToken(newPayload),
  ]);

  await RefreshTokenRepository.set(payload.sub, newJti, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
}