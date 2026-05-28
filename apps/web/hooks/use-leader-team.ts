"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getLeaderTeam,
  createLeaderTeam,
  updateLeaderTeam,
  uploadLeaderImage,
  uploadFileToPresignedUrl,
  type CreateLeaderTeamInput,
  type UpdateLeaderTeamInput,
} from "@/lib/api/leader";

export function useLeaderTeam() {
  return useQuery({
    queryKey: ["leader", "team"],
    queryFn: getLeaderTeam,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useCreateLeaderTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLeaderTeamInput) => createLeaderTeam(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leader", "team"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useUpdateLeaderTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLeaderTeamInput) => updateLeaderTeam(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leader", "team"] });
    },
  });
}

export function useUploadLeaderImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const { urlPresigned, publicUrl } = await uploadLeaderImage({
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
