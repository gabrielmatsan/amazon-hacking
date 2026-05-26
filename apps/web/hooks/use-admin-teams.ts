"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTeamsInReview,
  approveTeam,
  rejectTeam,
  getVotesDashboard,
  getFlaggedVotes,
  approveVote,
  invalidateVote,
  getAppConfig,
  updateAppConfig,
} from "@/lib/api/admin";
import { useInfiniteQuery } from "@tanstack/react-query";

export function useTeamsInReview() {
  return useQuery({
    queryKey: ["admin", "teams", "review"],
    queryFn: listTeamsInReview,
  });
}

export function useApproveTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => approveTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teams", "review"] });
    },
  });
}

export function useRejectTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectTeam(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teams", "review"] });
    },
  });
}

export function useVotesDashboard() {
  return useQuery({
    queryKey: ["admin", "votes", "dashboard"],
    queryFn: getVotesDashboard,
  });
}

export function useFlaggedVotes() {
  return useInfiniteQuery({
    queryKey: ["admin", "votes", "flagged"],
    queryFn: ({ pageParam }) => getFlaggedVotes(pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

export function useApproveVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveVote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "votes"] });
    },
  });
}

export function useInvalidateVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invalidateVote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "votes"] });
    },
  });
}

export function useAppConfig() {
  return useQuery({
    queryKey: ["admin", "config"],
    queryFn: getAppConfig,
  });
}

export function useUpdateAppConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { votingStartsAt: string | null; votingEndsAt: string | null; votingEnabled: boolean; maxRiskScore: number }) =>
      updateAppConfig(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "config"] });
    },
  });
}
