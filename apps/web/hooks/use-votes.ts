"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { getMyVote, requestVoteToken } from "@/lib/api/votes";
import { useFingerprint } from "./use-fingerprint";

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
  const getFingerprint = useFingerprint();

  return useMutation({
    mutationFn: async ({ teamId, token }: { teamId: string; token: string }) => {
      const fingerprint = getFingerprint();
      const { data } = await axios.post("/api/vote", { teamId, token, fingerprint });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["votes", "me"] });
    },
  });
}
