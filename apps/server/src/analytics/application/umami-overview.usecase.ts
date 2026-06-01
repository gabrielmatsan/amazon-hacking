import { t, type Static } from "elysia";
import { env } from "@/shared/infra/env/env";
import { cacheFirst } from "@/shared/infra/databases/redis";
import { umamiGet, umamiPost, umamiWebsiteId } from "@/shared/infra/umami/umami-client";

const FUNNEL_WINDOW_DAYS = 30;

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
  regions: t.Array(metricRow),
  cities: t.Array(metricRow),
  languages: t.Array(metricRow),
  conversionByTeam: t.Array(
    t.Object({
      team: t.String(),
      views: t.Number(),
      votes: t.Number(),
      rate: t.Number(),
    }),
  ),
  webVitals: t.Object({
    lcp: t.Number(),
    inp: t.Number(),
    cls: t.Number(),
    fcp: t.Number(),
    ttfb: t.Number(),
    count: t.Number(),
  }),
  utm: t.Object({
    source: t.Array(metricRow),
    medium: t.Array(metricRow),
    campaign: t.Array(metricRow),
  }),
  funnel: t.Array(
    t.Object({
      value: t.String(),
      visitors: t.Number(),
      dropoff: t.Number(),
      remaining: t.Number(),
    }),
  ),
});

export type UmamiOverviewOutput = Static<typeof umamiOverviewOutput>;

// ----------------------------------------------------------------------------
// Umami response shapes (only the fields we read)
// ----------------------------------------------------------------------------

type RawStats = Record<string, number> & { comparison?: Record<string, number> };
type RawSeriesPoint = { x: string; y: number };
type RawPageviews = { pageviews: RawSeriesPoint[]; sessions: RawSeriesPoint[] };
type RawMetric = { x: string | null; y: number };

type RawPercentile = { p75?: number };
type RawPerformance = {
  summary?: { lcp?: RawPercentile; inp?: RawPercentile; cls?: RawPercentile; fcp?: RawPercentile; ttfb?: RawPercentile; count?: number };
};
type RawUtmRow = { utm: string; views: number };
type RawUtm = { utm_source?: RawUtmRow[]; utm_medium?: RawUtmRow[]; utm_campaign?: RawUtmRow[] };
type RawFunnelStep = { value: string; visitors: number; dropoff: number | null; remaining: number };
type RawEventValue = { value: string; total: number };

const num = (value: unknown): number => (typeof value === "number" ? value : 0);

const isoFromMs = (ms: number): string => new Date(ms).toISOString();

// Reports may not exist yet (no Web Vitals collected, no UTM traffic, events not
// fired). A failed optional report must not sink the whole overview.
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

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

function toWebVitals(raw: RawPerformance | undefined) {
  const s = raw?.summary;
  return {
    lcp: num(s?.lcp?.p75),
    inp: num(s?.inp?.p75),
    cls: num(s?.cls?.p75),
    fcp: num(s?.fcp?.p75),
    ttfb: num(s?.ttfb?.p75),
    count: num(s?.count),
  };
}

function toUtmRows(raw: RawUtmRow[] | undefined): Array<{ name: string; value: number }> {
  return (raw ?? []).map((row) => ({ name: row.utm, value: num(row.views) }));
}

function toFunnel(raw: RawFunnelStep[] | undefined) {
  return (raw ?? []).map((step) => ({
    value: step.value,
    visitors: num(step.visitors),
    dropoff: typeof step.dropoff === "number" ? step.dropoff : 0,
    remaining: num(step.remaining),
  }));
}

// Joins per-team views (solution-viewed) and votes (vote-submitted), both keyed by
// the teamName carried in the event data, into a conversion table.
function toConversionByTeam(views: RawEventValue[] | undefined, votes: RawEventValue[] | undefined) {
  const byTeam = new Map<string, { team: string; views: number; votes: number }>();

  for (const row of views ?? []) {
    byTeam.set(row.value, { team: row.value, views: num(row.total), votes: 0 });
  }
  for (const row of votes ?? []) {
    const existing = byTeam.get(row.value) ?? { team: row.value, views: 0, votes: 0 };
    existing.votes = num(row.total);
    byTeam.set(row.value, existing);
  }

  return [...byTeam.values()]
    .map((entry) => ({ ...entry, rate: entry.views > 0 ? entry.votes / entry.views : 0 }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 12);
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
  const teamEventValues = (event: string) =>
    safe(
      () =>
        umamiGet<RawEventValue[]>(`/websites/${websiteId}/event-data/values`, {
          ...base,
          event,
          propertyName: "teamName",
        }),
      undefined,
    );

  const reportRange = { startDate: isoFromMs(startAt), endDate: isoFromMs(endAt), timezone: env.UMAMI_TIMEZONE };

  const [
    stats,
    pageviews,
    topPages,
    referrers,
    countries,
    regions,
    cities,
    languages,
    browsers,
    os,
    devices,
    events,
    performance,
    utm,
    funnel,
    teamViews,
    teamVotes,
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
    metric("region"),
    metric("city"),
    metric("language"),
    metric("browser"),
    metric("os"),
    metric("device"),
    metric("event"),
    safe(
      () =>
        umamiPost<RawPerformance>("/reports/performance", {
          websiteId,
          type: "performance",
          filters: {},
          parameters: reportRange,
        }),
      undefined,
    ),
    safe(
      () =>
        umamiPost<RawUtm>("/reports/utm", {
          websiteId,
          type: "utm",
          filters: {},
          parameters: { startDate: reportRange.startDate, endDate: reportRange.endDate },
        }),
      undefined,
    ),
    safe(
      () =>
        umamiPost<RawFunnelStep[]>("/reports/funnel", {
          websiteId,
          type: "funnel",
          filters: {},
          parameters: {
            ...reportRange,
            steps: [
              { type: "event", value: "solution-viewed" },
              { type: "event", value: "vote-token-requested" },
              { type: "event", value: "vote-submitted" },
            ],
            window: FUNNEL_WINDOW_DAYS,
          },
        }),
      undefined,
    ),
    teamEventValues("solution-viewed"),
    teamEventValues("vote-submitted"),
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
    regions: toMetricRows(regions),
    cities: toMetricRows(cities),
    languages: toMetricRows(languages),
    conversionByTeam: toConversionByTeam(teamViews, teamVotes),
    webVitals: toWebVitals(performance),
    utm: {
      source: toUtmRows(utm?.utm_source),
      medium: toUtmRows(utm?.utm_medium),
      campaign: toUtmRows(utm?.utm_campaign),
    },
    funnel: toFunnel(funnel),
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
