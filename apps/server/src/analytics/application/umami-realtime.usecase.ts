import { t, type Static } from "elysia";
import { umamiGet, umamiWebsiteId } from "@/shared/infra/umami/umami-client";

export const umamiRealtimeOutput = t.Object({
  online: t.Number(),
});

export type UmamiRealtimeOutput = Static<typeof umamiRealtimeOutput>;

// Active visitors in the last 5 minutes. Not cached — the dashboard polls this
// on a short interval, so freshness beats sparing the (cheap) upstream call.
export async function umamiRealtimeUseCase(): Promise<UmamiRealtimeOutput> {
  const websiteId = umamiWebsiteId();
  const active = await umamiGet<{ visitors?: number }>(`/websites/${websiteId}/active`);
  return { online: typeof active.visitors === "number" ? active.visitors : 0 };
}
