"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { m } from "@/lib/paraglide/messages";
import { trackEvent } from "@/lib/analytics/umami";
import { captureRefFromUrl } from "@/lib/analytics/referral";
import { MySupporters } from "./my-supporters";
import type { Locale } from "@/lib/paraglide/runtime";
import { useTeamGroups, useTeamSearch } from "@/hooks/use-teams";
import type { SolutionPillar, TeamListItem, TeamSearchItem } from "@/lib/api/types";

const SEARCH_MIN_LENGTH = 2;

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

const PILLAR_ORDER: SolutionPillar[] = [
  "verticalization",
  "health",
  "education",
  "logistics",
  "governance_financial_sustainability",
  "default",
];

function pillarLabel(pillar: SolutionPillar, locale: Locale): string {
  const labels: Record<SolutionPillar, () => string> = {
    digital_agriculture: () => m.pillar_digital_agriculture({}, { locale }),
    bioeconomy: () => m.pillar_bioeconomy({}, { locale }),
    logistics: () => m.pillar_logistics({}, { locale }),
    education: () => m.pillar_education({}, { locale }),
    health: () => m.pillar_health({}, { locale }),
    verticalization: () => m.pillar_verticalization({}, { locale }),
    governance_financial_sustainability: () =>
      m.pillar_governance_financial_sustainability({}, { locale }),
    default: () => m.pillar_default({}, { locale }),
  };
  return labels[pillar]();
}

const PILLAR_COLORS: Record<SolutionPillar, { bg: string; text: string; ring: string }> = {
  digital_agriculture: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  bioeconomy: { bg: "bg-lime-50", text: "text-lime-700", ring: "ring-lime-200" },
  logistics: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  education: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  health: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  verticalization: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
  governance_financial_sustainability: { bg: "bg-teal-50", text: "text-teal-700", ring: "ring-teal-200" },
  default: { bg: "bg-neutrals-100", text: "text-neutrals-600", ring: "ring-neutrals-200" },
};

const PILLAR_ACCENT: Record<SolutionPillar, string> = {
  digital_agriculture: "bg-emerald-500",
  bioeconomy: "bg-lime-500",
  logistics: "bg-amber-500",
  education: "bg-sky-500",
  health: "bg-rose-500",
  verticalization: "bg-violet-500",
  governance_financial_sustainability: "bg-teal-500",
  default: "bg-neutrals-400",
};

function teamHref(slug: string, locale: Locale): string {
  const base = locale === "pt-br" ? "" : `/${locale}`;
  return `${base}/solucoes/${slug}`;
}

export function SolutionsGallery({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const [activePillar, setActivePillar] = useState<SolutionPillar | "all">("all");

  const { data: groups, isLoading, error } = useTeamGroups();

  const debouncedQuery = useDebouncedValue(query, 300);
  const isSearching = debouncedQuery.trim().length >= SEARCH_MIN_LENGTH;
  const { data: searchData, isFetching: isSearchFetching } = useTeamSearch(debouncedQuery);

  const availablePillars = useMemo(() => {
    if (!groups) return [];
    return groups
      .map((g) => g.solutionPillar)
      .sort((a, b) => PILLAR_ORDER.indexOf(a) - PILLAR_ORDER.indexOf(b));
  }, [groups]);

  // Browse mode (no search): show the pillar-grouped gallery, filtered by the active pillar.
  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups
      .filter((g) => activePillar === "all" || g.solutionPillar === activePillar)
      .filter((g) => g.teams.length > 0);
  }, [groups, activePillar]);

  // Search mode: server-side ranked results (FTS + trigram), filtered by the active pillar.
  const searchResults = useMemo(() => {
    if (!searchData) return [];
    return activePillar === "all"
      ? searchData
      : searchData.filter((t) => t.solutionPillar === activePillar);
  }, [searchData, activePillar]);

  useEffect(() => {
    if (!isSearching || isSearchFetching) return;
    trackEvent("solutions-search", {
      length: debouncedQuery.trim().length,
      hasResults: searchResults.length > 0,
    });
  }, [isSearching, isSearchFetching, debouncedQuery, searchResults.length]);

  useEffect(() => {
    captureRefFromUrl();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  if (error || !groups) {
    return (
      <p className="mt-16 text-center text-white/80">
        {m.solutions_no_results({}, { locale })}
      </p>
    );
  }

  return (
    <div className="w-full">
      <div className="mx-auto mb-10 max-w-3xl">
        <MySupporters locale={locale} />
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center gap-6">
        {/* Search */}
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-lg">
            <svg width="18" height="18" viewBox="0 0 20 20" className="shrink-0 text-neutrals-400" aria-hidden>
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" fill="none" />
              <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={m.solutions_search_placeholder({}, { locale })}
              aria-label={m.solutions_search_placeholder({}, { locale })}
              className="w-full bg-transparent text-sm text-black outline-none placeholder:text-neutrals-400"
            />
          </div>
        </div>

        {/* Pillar filter pills */}
        {availablePillars.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activePillar === "all"}
              onClick={() => setActivePillar("all")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                activePillar === "all"
                  ? "bg-white text-primary-100 shadow-md"
                  : "bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              {m.pillar_all({}, { locale })}
            </button>
            {availablePillars.map((pillar) => (
              <button
                key={pillar}
                type="button"
                role="tab"
                aria-selected={activePillar === pillar}
                onClick={() => setActivePillar(pillar)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  activePillar === pillar
                    ? "bg-white text-primary-100 shadow-md"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {pillarLabel(pillar, locale)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {isSearching ? (
        <SearchResults
          results={searchResults}
          isFetching={isSearchFetching}
          hasData={searchData !== undefined}
          locale={locale}
        />
      ) : filteredGroups.length === 0 ? (
        <p className="mt-16 text-center text-white/80">
          {m.solutions_no_results({}, { locale })}
        </p>
      ) : (
        <div className="mt-12 space-y-14">
          {filteredGroups.map((group) => {
            const colors = PILLAR_COLORS[group.solutionPillar];
            const accent = PILLAR_ACCENT[group.solutionPillar];

            return (
              <section key={group.solutionPillar}>
                <div className="mb-6 flex items-center gap-3">
                  <span className={`size-3 rounded-full ${accent}`} aria-hidden />
                  <h3 className="text-lg font-semibold text-white md:text-xl">
                    {pillarLabel(group.solutionPillar, locale)}
                  </h3>
                  <span className="text-sm text-white/50 tabular-nums">
                    {m.solutions_teams_count({ count: group.teams.length }, { locale })}
                  </span>
                </div>

                <ul role="list" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {group.teams.map((team) => (
                    <li key={team.id}>
                      <TeamCard
                        team={team}
                        pillar={group.solutionPillar}
                        colors={colors}
                        locale={locale}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchResults({
  results,
  isFetching,
  hasData,
  locale,
}: {
  results: TeamSearchItem[];
  isFetching: boolean;
  hasData: boolean;
  locale: Locale;
}) {
  // First load for a new term: no previous results to show yet.
  if (isFetching && !hasData) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <p className="mt-16 text-center text-white/80">
        {m.solutions_no_results({}, { locale })}
      </p>
    );
  }

  return (
    <div className="mt-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-white/50 tabular-nums">
          {m.solutions_teams_count({ count: results.length }, { locale })}
        </span>
        {isFetching && (
          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
        )}
      </div>

      <ul role="list" className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {results.map((team) => (
          <li key={team.id}>
            <TeamCard
              team={team}
              pillar={team.solutionPillar}
              colors={PILLAR_COLORS[team.solutionPillar]}
              locale={locale}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamCard({
  team,
  pillar,
  colors,
  locale,
}: {
  team: TeamListItem;
  pillar: SolutionPillar;
  colors: { bg: string; text: string; ring: string };
  locale: Locale;
}) {
  return (
    <Link
      href={teamHref(team.slug, locale)}
      className="group flex w-full flex-col items-center gap-4 rounded-2xl bg-white p-5 text-center ring-1 ring-black/5 hover:-translate-y-0.5 hover:shadow-xl md:p-6"
    >
      <div
        className={`relative size-16 shrink-0 overflow-hidden rounded-full ring-2 ring-primary-100/10 ${team.logoUrl ? "bg-white" : "bg-primary-400"}`}
      >
        {team.logoUrl ? (
          <Image
            src={team.logoUrl}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-xl font-semibold text-white">
            {team.name.charAt(0)}
          </span>
        )}
      </div>
      <p className="text-base font-semibold text-black">{team.name}</p>
      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
        {pillarLabel(pillar, locale)}
      </span>
    </Link>
  );
}
