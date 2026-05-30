import { logger } from "@/shared/infra/observability";

import { SessionRepository } from "../infra/session.repository";

export async function logoutUseCase(sid: string | undefined): Promise<void> {
  if (!sid) {
    logger.debug("Logout called without an active session cookie, nothing to revoke");
    return;
  }

  await SessionRepository.destroy(sid);
  logger.info({ sessionId: sid }, "Session revoked via logout");
}
