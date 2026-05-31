import { api } from "./client";
import type { Team } from "./types";

export type CreateLeaderTeamInput = {
  name: string;
  description?: string;
  teamMembers?: Array<{
    name: string;
    role: string;
    email?: string;
    imageUrl?: string;
    links?: { website?: string; linkedin?: string; github?: string };
  }>;
  videoUrl?: string | null;
  secondaryVideoUrl?: string | null;
  solutionPillar?: string;
  logoUrl?: string | null;
};

export type UpdateLeaderTeamInput = Partial<CreateLeaderTeamInput>;

export async function getLeaderTeam(): Promise<Team | null> {
  const { data } = await api.get<{ data: Team | null }>("/leader/teams");
  return data.data;
}

export async function createLeaderTeam(input: CreateLeaderTeamInput) {
  const { data } = await api.post<{ data: Team }>("/leader/teams", input);
  return data.data;
}

export async function updateLeaderTeam(input: UpdateLeaderTeamInput) {
  const { data } = await api.put<{ data: Team }>("/leader/teams", input);
  return data.data;
}

export async function checkSlugAvailability(slug: string) {
  const { data } = await api.get<{ data: { available: boolean } }>(
    `/leader/teams/check-slug/${slug}`,
  );
  return data.data;
}

export type UploadImageInput = {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileContent: string;
};

export type UploadImageOutput = {
  urlPresigned: string;
  publicUrl: string;
};

export async function uploadLeaderImage(input: UploadImageInput) {
  const { data } = await api.post<{ data: UploadImageOutput }>(
    "/leader/images",
    input,
  );
  return data.data;
}

export async function uploadFileToPresignedUrl(
  presignedUrl: string,
  file: File,
) {
  console.log("[upload] presigned URL:", presignedUrl);
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[upload] failed:", res.status, text);
    throw new Error(`Upload failed: ${res.status}`);
  }
}
