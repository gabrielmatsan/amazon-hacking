// Pure transforms from raw Umami responses to our overview shape. No IO/env/redis
// here so they can be unit-tested in isolation.

export type RawStats = Record<string, number> & { comparison?: Record<string, number> };
export type RawSeriesPoint = { x: string; y: number };
export type RawPageviews = { pageviews: RawSeriesPoint[]; sessions: RawSeriesPoint[] };
export type RawMetric = { x: string | null; y: number };

type RawPercentile = { p75?: number };
export type RawPerformance = {
  summary?: { lcp?: RawPercentile; inp?: RawPercentile; cls?: RawPercentile; fcp?: RawPercentile; ttfb?: RawPercentile; count?: number };
};
export type RawUtmRow = { utm: string; views: number };
export type RawUtm = { utm_source?: RawUtmRow[]; utm_medium?: RawUtmRow[]; utm_campaign?: RawUtmRow[] };
export type RawFunnelStep = { value: string; visitors: number; dropoff: number | null; remaining: number | null };
export type RawEventValue = { value: string; total: number };

export const num = (value: unknown): number => (typeof value === "number" ? value : 0);

export function toTotals(raw: Record<string, number> | undefined) {
  return {
    pageviews: num(raw?.pageviews),
    visitors: num(raw?.visitors),
    visits: num(raw?.visits),
    bounces: num(raw?.bounces),
    totaltime: num(raw?.totaltime),
  };
}

export function toMetricRows(raw: RawMetric[]): Array<{ name: string; value: number }> {
  return raw
    .filter((row) => row.x !== null && row.x !== "")
    .map((row) => ({ name: row.x as string, value: num(row.y) }));
}

export function toWebVitals(raw: RawPerformance | undefined) {
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

export function toUtmRows(raw: RawUtmRow[] | undefined): Array<{ name: string; value: number }> {
  return (raw ?? []).map((row) => ({ name: row.utm, value: num(row.views) }));
}

export function toFunnel(raw: RawFunnelStep[] | undefined) {
  return (raw ?? []).map((step) => ({
    value: step.value,
    visitors: num(step.visitors),
    dropoff: typeof step.dropoff === "number" ? step.dropoff : 0,
    remaining: num(step.remaining),
  }));
}

// Joins per-team views (solution-viewed) and votes (vote-submitted), both keyed by
// the teamName carried in the event data, into a conversion table.
export function toConversionByTeam(views: RawEventValue[] | undefined, votes: RawEventValue[] | undefined) {
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
