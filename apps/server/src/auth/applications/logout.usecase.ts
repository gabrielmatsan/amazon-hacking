import { verifyRefreshToken } from "../infra/jwt.service";
import { RefreshTokenRepository } from "../infra/refresh.repository";

export async function logoutUseCase(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;

  try {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload.jti) await RefreshTokenRepository.delete(payload.sub, payload.jti);
  } catch {
    // Invalid or expired token — cleanup best-effort
  }
}