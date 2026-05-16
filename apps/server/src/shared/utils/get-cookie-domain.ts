import { env } from "../infra/env/env";

export function getCookieDomain(): string {
  const hostname = new URL(env.FRONTEND_URL).hostname;
  // Extract root domain (e.g., "cbb-web.brev-ly.uk" → ".brev-ly.uk")
  // so cookies are shared across all subdomains
  const parts = hostname.split(".");
  if (parts.length > 2) {
    return `.${parts.slice(-2).join(".")}`;
  }
  return hostname;
}