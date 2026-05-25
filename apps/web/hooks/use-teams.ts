"use client";

import { useQuery } from "@tanstack/react-query";
import { listTeams, getTeamBySlug } from "@/lib/api/teams";

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
