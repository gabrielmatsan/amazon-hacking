"use client";

import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api/auth";

export function useAuth() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getMe,
    retry: false,
  });
}
