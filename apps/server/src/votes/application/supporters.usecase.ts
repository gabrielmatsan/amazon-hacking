import { t, type Static } from "elysia";
import { umamiGet, umamiWebsiteId } from "@/shared/infra/umami/umami-client";
import { num } from "@/analytics/application/umami-overview.mappers";
import { UsersRepository } from "@/users/infra/users.repository";

// "My supporters": supporters share a personal link carrying ref=<userId>. Votes
// from those links fire `vote-submitted` with a `ref` property, so Umami groups
// votes-brought per supporter. We only ever expose the podium (1st/2nd/3rd) and
// the caller's own position — never the raw counts.

const WINDOW_MS = 180 * 24 * 60 * 60 * 1000; // whole campaign window

export const supportersLeaderboardOutput = t.Object({
  podium: t.Array(t.Object({ position: t.Number(), name: t.String() })),
  myPosition: t.Union([t.Number(), t.Null()]),
  participating: t.Boolean(),
});

export type SupportersLeaderboardOutput = Static<typeof supportersLeaderboardOutput>;

type RankedRef = { ref: string; total: number };

function firstName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Apoiador";
  return trimmed.split(/\s+/)[0];
}

async function rankedRefs(slug?: string): Promise<RankedRef[]> {
  const websiteId = umamiWebsiteId();
  const endAt = Date.now();
  const startAt = endAt - WINDOW_MS;

  // With a slug, scope to votes cast on that solution's page; without, it's the
  // hackathon-wide board. The vote-submitted event fires on /solucoes/:slug.
  const rows = await umamiGet<Array<{ value: string; total: number }>>(
    `/websites/${websiteId}/event-data/values`,
    {
      startAt,
      endAt,
      event: "vote-submitted",
      propertyName: "ref",
      ...(slug ? { path: `/solucoes/${slug}` } : {}),
    },
  );

  return (rows ?? [])
    .map((row) => ({ ref: row.value, total: num(row.total) }))
    .filter((row) => row.ref && row.total > 0)
    .sort((a, b) => b.total - a.total);
}

export async function supportersLeaderboardUseCase(
  userId: string | null,
  slug?: string,
): Promise<SupportersLeaderboardOutput> {
  let ranked: RankedRef[];
  try {
    ranked = await rankedRefs(slug);
  } catch {
    // Umami not configured / unreachable — degrade to an empty board.
    return { podium: [], myPosition: null, participating: false };
  }

  const top3 = ranked.slice(0, 3);
  const names = await Promise.all(
    top3.map(async (entry) => {
      const user = await UsersRepository.findById(entry.ref);
      return firstName(user?.name ?? "");
    }),
  );

  const podium = top3.map((_, index) => ({ position: index + 1, name: names[index] }));

  const myIndex = userId ? ranked.findIndex((entry) => entry.ref === userId) : -1;
  const myPosition = myIndex >= 0 && myIndex < 3 ? myIndex + 1 : null;

  return { podium, myPosition, participating: myIndex >= 0 };
}
