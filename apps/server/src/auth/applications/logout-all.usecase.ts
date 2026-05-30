import { logger } from "@/shared/infra/observability";

import { SessionRepository } from "../infra/session.repository";

export async function logoutAllUseCase(userId: string): Promise<number> {
  const revoked = await SessionRepository.destroyAll(userId);
  logger.info({ userId, revoked }, "Revoked all active sessions for user");
  return revoked;
}
