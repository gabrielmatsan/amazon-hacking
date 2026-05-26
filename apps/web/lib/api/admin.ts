import { api } from "./client";
import type { Team } from "./types";

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
