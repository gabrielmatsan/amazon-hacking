import { t, type Static } from "elysia";
import { umamiGet, umamiWebsiteId } from "@/shared/infra/umami/umami-client";
import { num } from "./umami-overview.mappers";
import { umamiRange, type UmamiRange } from "./umami-overview.usecase";

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_MS: Record<UmamiRange, number> = {
  "24h": DAY_MS,
  "7d": 7 * DAY_MS,
  "30d": 30 * DAY_MS,
  "90d": 90 * DAY_MS,
};

function bounds(range: UmamiRange, now: number) {
  return { startAt: now - RANGE_MS[range], endAt: now };
}

const str = (value: unknown): string => (typeof value === "string" ? value : "");

// ----------------------------------------------------------------------------
// List
// ----------------------------------------------------------------------------

export { umamiRange };

export const sessionsListQuery = t.Object({
  range: t.Optional(umamiRange),
  page: t.Optional(t.Number()),
  search: t.Optional(t.String()),
});

export const sessionsListOutput = t.Object({
  count: t.Number(),
  page: t.Number(),
  items: t.Array(
    t.Object({
      id: t.String(),
      browser: t.String(),
      os: t.String(),
      device: t.String(),
      country: t.String(),
      city: t.String(),
      firstAt: t.String(),
      lastAt: t.String(),
      visits: t.Number(),
      views: t.Number(),
    }),
  ),
});

export type SessionsListOutput = Static<typeof sessionsListOutput>;

type RawSessionRow = {
  id: string;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  city?: string;
  firstAt?: string;
  lastAt?: string;
  visits?: number;
  views?: number;
};

export async function umamiSessionsListUseCase(
  range: UmamiRange,
  page: number,
  search?: string,
): Promise<SessionsListOutput> {
  const websiteId = umamiWebsiteId();
  const { startAt, endAt } = bounds(range, Date.now());

  const res = await umamiGet<{ data?: RawSessionRow[]; count?: number; page?: number }>(
    `/websites/${websiteId}/sessions`,
    { startAt, endAt, page, pageSize: 20, ...(search ? { search } : {}) },
  );

  return {
    count: num(res.count),
    page: num(res.page) || page,
    items: (res.data ?? []).map((row) => ({
      id: row.id,
      browser: str(row.browser),
      os: str(row.os),
      device: str(row.device),
      country: str(row.country),
      city: str(row.city),
      firstAt: str(row.firstAt),
      lastAt: str(row.lastAt),
      visits: num(row.visits),
      views: num(row.views),
    })),
  };
}

// ----------------------------------------------------------------------------
// Detail (session + activity timeline + properties)
// ----------------------------------------------------------------------------

export const sessionDetailOutput = t.Object({
  session: t.Object({
    id: t.String(),
    distinctId: t.String(),
    browser: t.String(),
    os: t.String(),
    device: t.String(),
    country: t.String(),
    city: t.String(),
    firstAt: t.String(),
    lastAt: t.String(),
    visits: t.Number(),
    views: t.Number(),
    events: t.Number(),
    totaltime: t.Number(),
  }),
  activity: t.Array(
    t.Object({
      createdAt: t.String(),
      urlPath: t.String(),
      eventType: t.Number(),
      eventName: t.String(),
    }),
  ),
  properties: t.Array(t.Object({ key: t.String(), value: t.String() })),
});

export type SessionDetailOutput = Static<typeof sessionDetailOutput>;

type RawSessionDetail = Record<string, unknown>;
type RawActivity = { createdAt?: string; urlPath?: string; eventType?: number; eventName?: string };
type RawProperty = { dataKey?: string; stringValue?: string | null; numberValue?: number | null; dateValue?: string | null };

function propertyValue(p: RawProperty): string {
  if (p.stringValue != null) return p.stringValue;
  if (p.numberValue != null) return String(p.numberValue);
  if (p.dateValue != null) return p.dateValue;
  return "";
}

export async function umamiSessionDetailUseCase(
  sessionId: string,
  range: UmamiRange,
): Promise<SessionDetailOutput> {
  const websiteId = umamiWebsiteId();
  const { startAt, endAt } = bounds(range, Date.now());

  const [session, activity, properties] = await Promise.all([
    umamiGet<RawSessionDetail>(`/websites/${websiteId}/sessions/${sessionId}`),
    umamiGet<RawActivity[]>(`/websites/${websiteId}/sessions/${sessionId}/activity`, { startAt, endAt }),
    umamiGet<RawProperty[]>(`/websites/${websiteId}/sessions/${sessionId}/properties`),
  ]);

  return {
    session: {
      id: str(session.id),
      distinctId: str(session.distinctId),
      browser: str(session.browser),
      os: str(session.os),
      device: str(session.device),
      country: str(session.country),
      city: str(session.city),
      firstAt: str(session.firstAt),
      lastAt: str(session.lastAt),
      visits: num(session.visits),
      views: num(session.views),
      events: num(session.events),
      totaltime: num(session.totaltime),
    },
    activity: (activity ?? []).map((row) => ({
      createdAt: str(row.createdAt),
      urlPath: str(row.urlPath),
      eventType: num(row.eventType),
      eventName: str(row.eventName),
    })),
    properties: (properties ?? []).map((row) => ({ key: str(row.dataKey), value: propertyValue(row) })),
  };
}
