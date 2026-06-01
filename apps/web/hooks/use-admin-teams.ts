"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTeamsInReview,
  approveTeam,
  rejectTeam,
  getVotesDashboard,
  getVisitorsAnalytics,
  getUmamiOverview,
  getUmamiRealtime,
  getUmamiSessions,
  getUmamiSession,
  getFlaggedVotes,
  approveVote,
  invalidateVote,
  getAppConfig,
  updateAppConfig,
  searchUsersByEmail,
  createAdminTeam,
  uploadAdminImage,
  uploadFileToPresignedUrl,
  type CreateAdminTeamInput,
  type UmamiRange,
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

export function useVisitorsAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics", "visitors"],
    queryFn: getVisitorsAnalytics,
    // Cloudflare analytics update slowly; avoid hammering the GraphQL API.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useUmamiOverview(range: UmamiRange) {
  return useQuery({
    queryKey: ["admin", "analytics", "umami", "overview", range],
    queryFn: () => getUmamiOverview(range),
    // Backend caches ~5 min; mirror that here to avoid redundant refetches.
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useUmamiRealtime() {
  return useQuery({
    queryKey: ["admin", "analytics", "umami", "realtime"],
    queryFn: getUmamiRealtime,
    refetchInterval: 30 * 1000,
    retry: false,
  });
}

export function useUmamiSessions(range: UmamiRange, page: number, search: string) {
  return useQuery({
    queryKey: ["admin", "analytics", "umami", "sessions", range, page, search],
    queryFn: () => getUmamiSessions(range, page, search || undefined),
    staleTime: 60 * 1000,
    retry: false,
  });
}

export function useUmamiSession(sessionId: string | null, range: UmamiRange) {
  return useQuery({
    queryKey: ["admin", "analytics", "umami", "session", sessionId, range],
    queryFn: () => getUmamiSession(sessionId as string, range),
    enabled: !!sessionId,
    retry: false,
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

export function useSearchUsersByEmail(email: string) {
  return useQuery({
    queryKey: ["admin", "users", "search", email],
    queryFn: () => searchUsersByEmail(email),
    enabled: email.length >= 3,
  });
}

export function useCreateAdminTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminTeamInput) => createAdminTeam(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "teams"] });
    },
  });
}

export function useUploadAdminImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const { urlPresigned, publicUrl } = await uploadAdminImage({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileContent: "",
      });
      await uploadFileToPresignedUrl(urlPresigned, file);
      return publicUrl;
    },
  });
}
