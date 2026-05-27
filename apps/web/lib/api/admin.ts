import { api } from "./client";
import type { AuthUser, Team } from "./types";

export type VoteDashboardTotals = {
  total: number;
  valid: number;
  flagged: number;
  invalidated: number;
  whatsapp: number;
  email: number;
};

export type VoteDashboardTeam = {
  teamId: string;
  teamName: string;
  teamSlug: string;
  logoUrl: string | null;
  valid: number;
  flagged: number;
  total: number;
};

export type VoteDashboardRecent = {
  id: string;
  status: string;
  channel: string;
  teamName: string;
  userName: string;
  userEmail: string;
  createdAt: string;
};

export type VotesDashboard = {
  totals: VoteDashboardTotals;
  perTeam: VoteDashboardTeam[];
  recent: VoteDashboardRecent[];
};

export async function listTeamsInReview() {
  const { data } = await api.get<{ data: Team[] }>("/admin/teams/review");
  return data.data;
}

export async function approveTeam(id: string) {
  const { data } = await api.put<{ data: Team }>(`/admin/teams/${id}/approve`);
  return data.data;
}

export async function rejectTeam(id: string, reason: string) {
  const { data } = await api.put<{ data: Team }>(`/admin/teams/${id}/reject`, {
    reason,
  });
  return data.data;
}

export async function getVotesDashboard() {
  const { data } = await api.get<{ data: VotesDashboard }>(
    "/admin/votes/dashboard",
  );
  return data.data;
}

export type FlaggedVote = {
  id: string;
  status: string;
  channel: string;
  phoneNumber: string | null;
  ipAddress: string | null;
  ipCountry: string | null;
  userAgent: string | null;
  fingerprint: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  teamName: string;
  teamSlug: string;
  userName: string;
  userEmail: string;
};

export type FlaggedVotesPage = {
  items: FlaggedVote[];
  nextCursor: string | null;
};

export async function getFlaggedVotes(cursor?: string, limit = 10) {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));
  const { data } = await api.get<{ data: FlaggedVotesPage }>(
    `/admin/votes/flagged?${params}`,
  );
  return data.data;
}

export async function approveVote(id: string) {
  const { data } = await api.put<{ data: { id: string; status: string } }>(
    `/admin/votes/${id}/approve`,
  );
  return data.data;
}

export async function invalidateVote(id: string) {
  const { data } = await api.put<{ data: { id: string; status: string } }>(
    `/admin/votes/${id}/invalidate`,
  );
  return data.data;
}

export type AppConfig = {
  id: string | null;
  votingStartsAt: string | null;
  votingEndsAt: string | null;
  votingEnabled: boolean;
  maxRiskScore: number;
  createdAt: string;
  updatedAt: string;
};

export async function getAppConfig() {
  const { data } = await api.get<{ data: AppConfig }>("/admin/config");
  return data.data;
}

export async function updateAppConfig(input: {
  votingStartsAt: string | null;
  votingEndsAt: string | null;
  votingEnabled: boolean;
  maxRiskScore: number;
}) {
  const { data } = await api.put<{ data: AppConfig }>("/admin/config", input);
  return data.data;
}

export async function searchUsersByEmail(email: string) {
  const { data } = await api.get<{ data: AuthUser[] }>(
    `/admin/user/email/${encodeURIComponent(email)}`,
  );
  return data.data;
}

export type CreateAdminTeamInput = {
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
  leaderId?: string;
};

export async function createAdminTeam(input: CreateAdminTeamInput) {
  const { data } = await api.post<{ data: Team }>("/admin/teams", input);
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

export async function uploadAdminImage(input: UploadImageInput) {
  const { data } = await api.post<{ data: UploadImageOutput }>(
    "/admin/images",
    input,
  );
  return data.data;
}

export async function uploadFileToPresignedUrl(
  presignedUrl: string,
  file: File,
) {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status}`);
  }
}
