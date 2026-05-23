import { SessionRepository } from "../infra/session.repository";

export async function logoutAllUseCase(userId: string): Promise<number> {
  return SessionRepository.destroyAll(userId);
}
