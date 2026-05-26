"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTeamsInReview,
  approveTeam,
  rejectTeam,
} from "@/lib/api/admin";

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
