"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestVoteToken, voteForTeam } from "@/lib/api/votes";

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
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}
