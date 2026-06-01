import { describe, expect, it } from "bun:test";

import {
  toConversionByTeam,
  toFunnel,
  toMetricRows,
  toTotals,
  toUtmRows,
  toWebVitals,
} from "./umami-overview.mappers";

describe("toTotals", () => {
  it("reads the five totals from a stats payload", () => {
    expect(toTotals({ pageviews: 320, visitors: 121, visits: 123, bounces: 53, totaltime: 13412 })).toEqual({
      pageviews: 320,
      visitors: 121,
      visits: 123,
      bounces: 53,
      totaltime: 13412,
    });
  });

  it("defaults missing or undefined fields to zero", () => {
    expect(toTotals(undefined)).toEqual({ pageviews: 0, visitors: 0, visits: 0, bounces: 0, totaltime: 0 });
    expect(toTotals({ pageviews: 5 } as Record<string, number>)).toMatchObject({ pageviews: 5, visitors: 0 });
  });
});

describe("toMetricRows", () => {
  it("maps x to name and y to value", () => {
    expect(toMetricRows([{ x: "/solucoes", y: 26 }])).toEqual([{ name: "/solucoes", value: 26 }]);
  });

  it("drops rows with a null or empty name", () => {
    expect(toMetricRows([{ x: null, y: 9 }, { x: "", y: 4 }, { x: "pt", y: 115 }])).toEqual([
      { name: "pt", value: 115 },
    ]);
  });
});

describe("toWebVitals", () => {
  it("reads p75 percentiles and the sample count", () => {
    const raw = {
      summary: { lcp: { p75: 1408 }, inp: { p75: 56 }, cls: { p75: 0.0067 }, fcp: { p75: 720 }, ttfb: { p75: 274 }, count: 28 },
    };
    expect(toWebVitals(raw)).toEqual({ lcp: 1408, inp: 56, cls: 0.0067, fcp: 720, ttfb: 274, count: 28 });
  });

  it("returns zeros when there is no summary (no data collected yet)", () => {
    expect(toWebVitals(undefined)).toEqual({ lcp: 0, inp: 0, cls: 0, fcp: 0, ttfb: 0, count: 0 });
  });
});

describe("toUtmRows", () => {
  it("maps utm to name and views to value", () => {
    expect(toUtmRows([{ utm: "ig", views: 8 }])).toEqual([{ name: "ig", value: 8 }]);
  });

  it("returns an empty array for undefined input", () => {
    expect(toUtmRows(undefined)).toEqual([]);
  });
});

describe("toFunnel", () => {
  it("coerces the null dropoff/remaining the live API returns with no data to zero", () => {
    const raw = [
      { type: "event", value: "solution-viewed", visitors: 0, previous: 0, dropped: 0, dropoff: null, remaining: null },
      { type: "event", value: "vote-submitted", visitors: 0, previous: 0, dropped: 0, dropoff: null, remaining: null },
    ];
    expect(toFunnel(raw)).toEqual([
      { value: "solution-viewed", visitors: 0, dropoff: 0, remaining: 0 },
      { value: "vote-submitted", visitors: 0, dropoff: 0, remaining: 0 },
    ]);
  });

  it("keeps real numeric dropoff/remaining", () => {
    expect(toFunnel([{ value: "a", visitors: 100, dropoff: 0.9, remaining: 0.1 }])).toEqual([
      { value: "a", visitors: 100, dropoff: 0.9, remaining: 0.1 },
    ]);
  });
});

describe("toConversionByTeam", () => {
  it("joins views and votes by team and computes the rate", () => {
    const views = [{ value: "Floresta", total: 100 }, { value: "Rede", total: 50 }];
    const votes = [{ value: "Floresta", total: 25 }, { value: "Rede", total: 10 }];
    expect(toConversionByTeam(views, votes)).toEqual([
      { team: "Floresta", views: 100, votes: 25, rate: 0.25 },
      { team: "Rede", views: 50, votes: 10, rate: 0.2 },
    ]);
  });

  it("sorts by votes descending", () => {
    const views = [{ value: "A", total: 10 }, { value: "B", total: 10 }];
    const votes = [{ value: "A", total: 2 }, { value: "B", total: 9 }];
    expect(toConversionByTeam(views, votes).map((r) => r.team)).toEqual(["B", "A"]);
  });

  it("yields rate 0 for a team with votes but no recorded views", () => {
    expect(toConversionByTeam([], [{ value: "Ghost", total: 3 }])).toEqual([
      { team: "Ghost", views: 0, votes: 3, rate: 0 },
    ]);
  });

  it("handles both inputs being undefined", () => {
    expect(toConversionByTeam(undefined, undefined)).toEqual([]);
  });
});
