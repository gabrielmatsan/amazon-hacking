import { describe, expect, it } from "vitest";
import { winners, winnerYears, winnersByYear } from "./winners";

describe("winners catalog", () => {
  it("has at least one winner per supported year", () => {
    const years = winnerYears();
    expect(years.length).toBeGreaterThan(0);
    for (const year of years) {
      expect(winnersByYear(year).length).toBeGreaterThan(0);
    }
  });

  it("orders years in descending sequence", () => {
    const years = winnerYears();
    const sorted = [...years].sort((a, b) => b - a);
    expect(years).toEqual(sorted);
  });

  it("provides a description for every winner", () => {
    for (const winner of winners) {
      expect(winner.description.length).toBeGreaterThan(0);
    }
  });

  it("assigns at least one prize per winner", () => {
    for (const winner of winners) {
      expect(winner.prizes.length).toBeGreaterThan(0);
    }
  });

  it("includes the full catalog (22 projects across 2022-2026)", () => {
    expect(winners.length).toBe(22);
    expect(winnersByYear(2026).length).toBe(4);
    expect(winnersByYear(2025).length).toBe(3);
    expect(winnersByYear(2024).length).toBe(3);
    expect(winnersByYear(2023).length).toBe(6);
    expect(winnersByYear(2022).length).toBe(6);
  });
});
