import axios from "axios";
import { api } from "./client";
import type { MyVoteResponse, VoteTokenResponse } from "./types";

export async function getMyVote() {
  const { data } = await api.get<{ data: MyVoteResponse }>("/votes/me");
  return data.data;
}

export async function requestVoteToken(phoneNumber: string, turnstileToken: string) {
  const { data } = await axios.post<VoteTokenResponse>("/api/vote-token", {
    phoneNumber,
    turnstileToken,
  });
  return data;
}

export type Torcida = {
  podium: Array<{ position: number; name: string }>;
  myPosition: number | null;
  participating: boolean;
};

export async function getTorcida() {
  const { data } = await api.get<{ data: Torcida }>("/votes/torcida");
  return data.data;
}
