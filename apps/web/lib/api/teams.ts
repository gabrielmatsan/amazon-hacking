import { api } from "./client";
import type { Team, TeamListGroup } from "./types";

export async function listTeams() {
  const { data } = await api.get<{ data: TeamListGroup[] }>("/teams");
  return data.data;
}

export async function getTeamBySlug(slug: string) {
  const { data } = await api.get<{ data: Team }>(`/teams/slug/${slug}`);
  return data.data;
}

export type LiveViewers = { total: number; viewers: Record<string, number> };

export async function getLiveViewers() {
  const { data } = await api.get<{ data: LiveViewers }>("/teams/live-viewers");
  return data.data;
}
