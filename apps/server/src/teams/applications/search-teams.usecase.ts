import { type Static, t } from "elysia";

import { solutionPillarType } from "../domain/teams.type";
import { TeamsRepository, type TeamSearchItem } from "../infra/teams.repository";

export const teamSearchItemSchema = t.Object({
  id: t.String(),
  name: t.String(),
  slug: t.String(),
  logoUrl: t.Nullable(t.String()),
  solutionPillar: solutionPillarType,
});

export type TeamSearchItemResponse = Static<typeof teamSearchItemSchema>;

const MIN_TERM_LENGTH = 2;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Busca teams ativos por relevancia textual (FTS portugues + trigram).
 * Retorna lista plana ordenada por relevancia. Termo curto demais ou vazio
 * retorna lista vazia sem tocar no banco.
 */
export async function searchTeams(
  rawTerm: string,
  rawLimit?: number,
): Promise<TeamSearchItem[]> {
  const term = rawTerm.trim();

  if (term.length < MIN_TERM_LENGTH) {
    return [];
  }

  const limit = Math.min(Math.max(rawLimit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  return TeamsRepository.search(term, limit);
}
