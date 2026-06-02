import { t, type Static } from "elysia";
import { cacheFirst } from "@/shared/infra/databases/redis";
import { umamiGet, umamiWebsiteId } from "@/shared/infra/umami/umami-client";

// Public "people viewing now" per solution, sourced from Umami's realtime URL
// breakdown. Cached briefly so a burst of solution-page loads triggers one
// upstream fetch, not one per visitor.

const CACHE_SECONDS = 15;
const SOLUTION_PATH = /^(?:\/(?:en|es))?\/solucoes\/([^/?#]+)$/;

export const liveViewersOutput = t.Object({
  total: t.Number(),
  viewers: t.Record(t.String(), t.Number()),
});

export type LiveViewersOutput = Static<typeof liveViewersOutput>;

async function fetchLiveViewers(): Promise<LiveViewersOutput> {
  const websiteId = umamiWebsiteId();
  const realtime = await umamiGet<{ urls?: Record<string, number>; totals?: { visitors?: number } }>(
    `/realtime/${websiteId}`,
  );

  const viewers: Record<string, number> = {};
  for (const [path, count] of Object.entries(realtime.urls ?? {})) {
    const match = path.match(SOLUTION_PATH);
    if (!match) continue;
    const slug = match[1];
    viewers[slug] = (viewers[slug] ?? 0) + (typeof count === "number" ? count : 0);
  }

  return { total: typeof realtime.totals?.visitors === "number" ? realtime.totals.visitors : 0, viewers };
}

export async function liveViewersUseCase(): Promise<LiveViewersOutput> {
  try {
    return await cacheFirst("umami:live-viewers", fetchLiveViewers, {
      ttl: CACHE_SECONDS,
      spanName: "umami:live-viewers",
    });
  } catch {
    // Public, best-effort social proof — never error the page on an Umami hiccup.
    return { total: 0, viewers: {} };
  }
}
