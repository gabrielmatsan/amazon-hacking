import { t, type Static } from "elysia";
import { VotesRepository } from "../infra/votes.repository";

export const votesDashboardOutput = t.Object({
  totals: t.Object({
    total: t.Number(),
    valid: t.Number(),
    flagged: t.Number(),
    invalidated: t.Number(),
    whatsapp: t.Number(),
    email: t.Number(),
  }),
  perTeam: t.Array(
    t.Object({
      teamId: t.String(),
      teamName: t.String(),
      teamSlug: t.String(),
      logoUrl: t.Nullable(t.String()),
      valid: t.Number(),
      flagged: t.Number(),
      total: t.Number(),
    }),
  ),
  recent: t.Array(
    t.Object({
      id: t.String(),
      status: t.String(),
      channel: t.String(),
      teamName: t.String(),
      userName: t.String(),
      userEmail: t.String(),
      createdAt: t.Date(),
    }),
  ),
});

export type VotesDashboardOutput = Static<typeof votesDashboardOutput>;

export async function votesDashboardUseCase(): Promise<VotesDashboardOutput> {
  return VotesRepository.dashboardStats();
}
