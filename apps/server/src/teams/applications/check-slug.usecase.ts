import { TeamsRepository } from "../infra/teams.repository";

export async function checkSlugUseCase(slug: string): Promise<{ available: boolean }> {
  const exists = await TeamsRepository.slugExists(slug);
  return { available: !exists };
}
