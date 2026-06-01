import { env } from "../env/env";
import { BadRequestError } from "../errors/bad-error-request";

const CLOUDFLARE_GRAPHQL_URL = "https://api.cloudflare.com/client/v4/graphql";

// Zone Analytics: daily groups expose `uniq.uniques` (unique visitors by IP).
// We pull one bucket per day over the window and also sum them for a headline number.
const ZONE_VISITORS_QUERY = `
  query ZoneVisitors($zoneTag: String!, $since: String!, $until: String!) {
    viewer {
      zones(filter: { zoneTag: $zoneTag }) {
        httpRequests1dGroups(
          orderBy: [date_ASC]
          limit: 366
          filter: { date_geq: $since, date_leq: $until }
        ) {
          dimensions { date }
          uniq { uniques }
          sum { requests }
        }
      }
    }
  }
`;

type GraphQLResponse = {
  data?: {
    viewer?: {
      zones?: Array<{
        httpRequests1dGroups?: Array<{
          dimensions: { date: string };
          uniq: { uniques: number };
          sum: { requests: number };
        }>;
      }>;
    };
  };
  errors?: Array<{ message: string }>;
};

export type ZoneVisitorsDay = {
  date: string;
  uniques: number;
  requests: number;
};

export type ZoneVisitors = {
  range: { since: string; until: string; days: number };
  uniqueVisitors: number;
  totalRequests: number;
  series: ZoneVisitorsDay[];
};

function toUtcDate(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

export async function fetchZoneUniqueVisitors(): Promise<ZoneVisitors> {
  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ZONE_ID) {
    throw new BadRequestError("Cloudflare analytics is not configured");
  }

  const days = env.CLOUDFLARE_ANALYTICS_DAYS;
  const since = toUtcDate(days - 1);
  const until = toUtcDate(0);

  const res = await fetch(CLOUDFLARE_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: ZONE_VISITORS_QUERY,
      variables: { zoneTag: env.CLOUDFLARE_ZONE_ID, since, until },
    }),
  });

  if (!res.ok) {
    throw new BadRequestError(`Cloudflare analytics request failed (${res.status})`);
  }

  const json = (await res.json()) as GraphQLResponse;

  if (json.errors?.length) {
    throw new BadRequestError(`Cloudflare analytics error: ${json.errors[0].message}`);
  }

  const groups = json.data?.viewer?.zones?.[0]?.httpRequests1dGroups ?? [];

  const series: ZoneVisitorsDay[] = groups.map((g) => ({
    date: g.dimensions.date,
    uniques: g.uniq.uniques,
    requests: g.sum.requests,
  }));

  return {
    range: { since, until, days },
    // Sum of daily uniques — same approximation Cloudflare's own dashboard uses for a
    // period (a visitor active on two days counts twice; there is no cross-day dedup field).
    uniqueVisitors: series.reduce((acc, d) => acc + d.uniques, 0),
    totalRequests: series.reduce((acc, d) => acc + d.requests, 0),
    series,
  };
}
