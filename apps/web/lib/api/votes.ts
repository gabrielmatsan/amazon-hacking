import axios from "axios";
import { api } from "./client";
import type { MyVoteResponse, VoteTokenResponse } from "./types";

export async function getMyVote() {
  const { data } = await api.get<{ data: MyVoteResponse }>("/votes/me");
  return data.data;
}

export async function requestVoteToken(phoneNumber: string) {
  const { data } = await axios.post<VoteTokenResponse>("/api/vote-token", {
    phoneNumber,
  });
  return data;
}
