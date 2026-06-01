// Builds a deep link into the self-hosted Umami UI to inspect the session(s) tied
// to a Distinct ID (the FingerprintJS visitorId we bind on vote-submitted). Lets
// an admin jump from a flagged vote straight to its journey + replay in Umami.

const UMAMI_SRC = process.env.NEXT_PUBLIC_UMAMI_SRC;
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

export function umamiSessionUrl(distinctId: string | null | undefined): string | null {
  if (!UMAMI_SRC || !UMAMI_WEBSITE_ID || !distinctId) return null;
  const host = UMAMI_SRC.replace(/\/script\.js.*$/, "").replace(/\/+$/, "");
  return `${host}/websites/${UMAMI_WEBSITE_ID}/sessions?query=${encodeURIComponent(distinctId)}`;
}
