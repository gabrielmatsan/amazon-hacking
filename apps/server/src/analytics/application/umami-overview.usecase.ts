import { t, type Static } from "elysia";
import { env } from "@/shared/infra/env/env";
import { cacheFirst } from "@/shared/infra/databases/redis";
import { umamiGet, umamiWebsiteId } from "@/shared/infra/umami/umami-client";

// ----------------------------------------------------------------------------
// Range
// ----------------------------------------------------------------------------

export const umamiRange = t.Union([
  t.Literal("24h"),
  t.Literal("7d"),
  t.Literal("30d"),
  t.Literal("90d"),
]);

export type UmamiRange = Static<typeof umamiRange>;

const DAY_MS = 24 * 60 * 60 * 1000;

const RANGE_CONFIG: Record<UmamiRange, { ms: number; unit: "hour" | "day" }> = {
  "24h": { ms: DAY_MS, unit: "hour" },
  "7d": { ms: 7 * DAY_MS, unit: "day" },
  "30d": { ms: 30 * DAY_MS, unit: "day" },
  "90d": { ms: 90 * DAY_MS, unit: "day" },
};

// ----------------------------------------------------------------------------
// Output schema
// ----------------------------------------------------------------------------

const metricRow = t.Object({ name: t.String(), value: t.Number() });

const statTotals = t.Object({
  pageviews: t.Number(),
  visitors: t.Number(),
  visits: t.Number(),
  bounces: t.Number(),
  totaltime: t.Number(),
});

export const umamiOverviewOutput = t.Object({
  range: t.Object({ key: umamiRange, startAt: t.Number(), endAt: t.Number() }),
  stats: t.Composite([
    statTotals,
    t.Object({ comparison: t.Optional(statTotals) }),
  ]),
  series: t.Array(
    t.Object({ t: t.String(), pageviews: t.Number(), sessions: t.Number() }),
  ),
  topPages: t.Array(metricRow),
  referrers: t.Array(metricRow),
  countries: t.Array(metricRow),
  browsers: t.Array(metricRow),
  os: t.Array(metricRow),
  devices: t.Array(metricRow),
  events: t.Array(metricRow),
});

export type UmamiOverviewOutput = Static<typeof umamiOverviewOutput>;

// ----------------------------------------------------------------------------
// Umami response shapes (only the fields we read)
// ----------------------------------------------------------------------------

type RawStats = Record<string, number> & { comparison?: Record<string, number> };
type RawSeriesPoint = { x: string; y: number };
type RawPageviews = { pageviews: RawSeriesPoint[]; sessions: RawSeriesPoint[] };
type RawMetric = { x: string | null; y: number };

const num = (value: unknown): number => (typeof value === "number" ? value : 0);

function toTotals(raw: Record<string, number> | undefined) {
  return {
    pageviews: num(raw?.pageviews),
    visitors: num(raw?.visitors),
    visits: num(raw?.visits),
    bounces: num(raw?.bounces),
    totaltime: num(raw?.totaltime),
  };
}

function toMetricRows(raw: RawMetric[]): Array<{ name: string; value: number }> {
  return raw
    .filter((row) => row.x !== null && row.x !== "")
    .map((row) => ({ name: row.x as string, value: num(row.y) }));
}

// ----------------------------------------------------------------------------
// Use case
// ----------------------------------------------------------------------------

async function fetchOverview(range: UmamiRange, endAt: number): Promise<UmamiOverviewOutput> {
  const websiteId = umamiWebsiteId();
  const { ms, unit } = RANGE_CONFIG[range];
  const startAt = endAt - ms;

  const base = { startAt, endAt };
  const metric = (type: string) =>
    umamiGet<RawMetric[]>(`/websites/${websiteId}/metrics`, { ...base, type, limit: 8 });

  const [
    stats,
    pageviews,
    topPages,
    referrers,
    countries,
    browsers,
    os,
    devices,
    events,
  ] = await Promise.all([
    umamiGet<RawStats>(`/websites/${websiteId}/stats`, { ...base, compare: "prev" }),
    umamiGet<RawPageviews>(`/websites/${websiteId}/pageviews`, {
      ...base,
      unit,
      timezone: env.UMAMI_TIMEZONE,
    }),
    metric("path"),
    metric("referrer"),
    metric("country"),
    metric("browser"),
    metric("os"),
    metric("device"),
    metric("event"),
  ]);

  const sessionsByTime = new Map(pageviews.sessions.map((point) => [point.x, num(point.y)]));
  const series = pageviews.pageviews.map((point) => ({
    t: point.x,
    pageviews: num(point.y),
    sessions: sessionsByTime.get(point.x) ?? 0,
  }));

  return {
    range: { key: range, startAt, endAt },
    stats: { ...toTotals(stats), comparison: stats.comparison ? toTotals(stats.comparison) : undefined },
    series,
    topPages: toMetricRows(topPages),
    referrers: toMetricRows(referrers),
    countries: toMetricRows(countries),
    browsers: toMetricRows(browsers),
    os: toMetricRows(os),
    devices: toMetricRows(devices),
    events: toMetricRows(events),
  };
}

export async function umamiOverviewUseCase(range: UmamiRange): Promise<UmamiOverviewOutput> {
  // Bucket the cache key per ~5-minute window so all admins in the same window
  // share one upstream fan-out instead of each hammering Umami.
  const cacheSeconds = env.UMAMI_OVERVIEW_CACHE_SECONDS;
  const bucket = Math.floor(Date.now() / (cacheSeconds * 1000));
  const endAt = bucket * cacheSeconds * 1000;

  return cacheFirst(
    `umami:overview:${range}:${bucket}`,
    () => fetchOverview(range, endAt),
    { ttl: cacheSeconds, spanName: "umami:overview" },
  );
}
