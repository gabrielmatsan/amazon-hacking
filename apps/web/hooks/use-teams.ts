"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listTeams, searchTeams, getTeamBySlug, getLiveViewers } from "@/lib/api/teams";

const MIN_SEARCH_LENGTH = 2;

export function useLiveViewers() {
  return useQuery({
    queryKey: ["teams", "live-viewers"],
    queryFn: getLiveViewers,
    refetchInterval: 20 * 1000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

export function useTeamGroups() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: listTeams,
  });
}

export function useTeamSearch(query: string) {
  const term = query.trim();
  return useQuery({
    queryKey: ["teams", "search", term],
    queryFn: () => searchTeams(term),
    enabled: term.length >= MIN_SEARCH_LENGTH,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });
}

export function useTeamBySlug(slug: string) {
  return useQuery({
    queryKey: ["teams", slug],
    queryFn: () => getTeamBySlug(slug),
  });
}
