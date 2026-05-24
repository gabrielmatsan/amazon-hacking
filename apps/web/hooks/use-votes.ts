"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMyVote, requestVoteToken, voteForTeam } from "@/lib/api/votes";

export function useMyVote() {
  return useQuery({
    queryKey: ["votes", "me"],
    queryFn: getMyVote,
    retry: false,
  });
}

export function useRequestVoteToken() {
  return useMutation({
    mutationFn: (phoneNumber: string) => requestVoteToken(phoneNumber),
  });
}

export function useVoteForTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, token }: { teamId: string; token: string }) =>
      voteForTeam(teamId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", "me"] });
    },
  });
}
