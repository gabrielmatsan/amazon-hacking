import { api } from "./client";
import type { MyVoteResponse, VoteTokenResponse } from "./types";

export async function getMyVote() {
  const { data } = await api.get<{ data: MyVoteResponse }>("/votes/me");
  return data.data;
}

export async function requestVoteToken(phoneNumber: string) {
  const { data } = await api.post<VoteTokenResponse>("/votes-token/request", {
    phoneNumber,
  });
  return data;
}
