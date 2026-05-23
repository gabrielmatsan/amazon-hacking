import { SessionRepository } from "../infra/session.repository";

export async function logoutUseCase(sid: string | undefined): Promise<void> {
  if (!sid) return;
  await SessionRepository.destroy(sid);
}
