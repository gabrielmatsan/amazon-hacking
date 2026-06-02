"use client";

import { useQuery } from "@tanstack/react-query";
import { listTeams, getTeamBySlug, getLiveViewers } from "@/lib/api/teams";

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

export function useTeamBySlug(slug: string) {
  return useQuery({
    queryKey: ["teams", slug],
    queryFn: () => getTeamBySlug(slug),
  });
}
