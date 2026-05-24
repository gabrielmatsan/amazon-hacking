import { api } from "./client";
import type { AuthUser } from "./types";

export async function getMe() {
  const { data } = await api.get<AuthUser>("/auth/me");
  return data;
}

export async function logout() {
  const { data } = await api.post<{ message: string }>("/auth/logout");
  return data;
}

export function getGoogleLoginUrl(returnTo?: string) {
  const base =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/v1";
  const url = new URL(`${base}/auth/google/login`);
  if (returnTo) url.searchParams.set("returnTo", returnTo);
  return url.toString();
}
