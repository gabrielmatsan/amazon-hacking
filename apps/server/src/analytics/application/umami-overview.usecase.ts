import { t, type Static } from "elysia";
import { env } from "@/shared/infra/env/env";
import { cacheFirst } from "@/shared/infra/databases/redis";
import { umamiGet, umamiPost, umamiWebsiteId } from "@/shared/infra/umami/umami-client";
import { loggers } from "@/shared/infra/observability/logger";
import {
  num,
  toConversionByTeam,
  toFunnel,
  toMetricRows,
  toTotals,
  toUtmRows,
  toWebVitals,
  type RawEventValue,
  type RawFunnelStep,
  type RawMetric,
  type RawPageviews,
  type RawPerformance,
  type RawStats,
  type RawUtm,
} from "./umami-overview.mappers";

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

const isoFromMs = (ms: number): string => new Date(ms).toISOString();

// Reports may not exist yet (no Web Vitals collected, no UTM traffic, events not
// fired). A failed optional report must not sink the whole overview — but it is
// logged so a genuine outage is visible instead of silently empty.
async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    loggers.api.warn(
      { report: label, error: error instanceof Error ? error.message : String(error) },
      "Umami report failed; using empty fallback",
    );
    return fallback;
  }
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
      `event-values:${event}`,
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
      "performance",
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
      "utm",
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
      "funnel",
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
