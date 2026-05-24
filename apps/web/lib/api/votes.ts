import { api } from "./client";
import type { VoteResponse, VoteTokenResponse } from "./types";

export async function voteForTeam(teamId: string, token: string) {
  const { data } = await api.post<VoteResponse>("/votes", { teamId, token });
  return data;
}

export async function requestVoteToken(phoneNumber: string) {
  const { data } = await api.post<VoteTokenResponse>("/votes-token/request", {
    phoneNumber,
  });
  return data;
}
