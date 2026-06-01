import { t, type Static } from "elysia";
import { fetchZoneUniqueVisitors } from "@/shared/infra/cloudflare/cloudflare-analytics";

export const visitorsAnalyticsOutput = t.Object({
  range: t.Object({
    since: t.String(),
    until: t.String(),
    days: t.Number(),
  }),
  uniqueVisitors: t.Number(),
  totalRequests: t.Number(),
  series: t.Array(
    t.Object({
      date: t.String(),
      uniques: t.Number(),
      requests: t.Number(),
    }),
  ),
});

export type VisitorsAnalyticsOutput = Static<typeof visitorsAnalyticsOutput>;

export async function visitorsAnalyticsUseCase(): Promise<VisitorsAnalyticsOutput> {
  return fetchZoneUniqueVisitors();
}
