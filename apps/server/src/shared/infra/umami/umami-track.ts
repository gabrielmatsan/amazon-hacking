import { env } from "../env/env";
import { loggers } from "../observability/logger";

// Server-side event ingestion (POST /api/send) — no auth, but Umami requires a
// real User-Agent. Use for events that happen without a browser (e.g. a vote
// confirmed in a backend transaction).

const SERVER_USER_AGENT = "amazon-hacking-server/1.0 (+https://amazon-hacking.com)";

function hostname(): string {
  try {
    return new URL(env.FRONTEND_URL).hostname;
  } catch {
    return "amazon-hacking.com";
  }
}

type ServerEventData = Record<string, string | number | boolean | null | undefined>;

// Fire-and-forget: never throws, so it can't break the calling flow. Callers
// should `void` it.
export async function trackServerEvent(name: string, data?: ServerEventData): Promise<void> {
  if (!env.UMAMI_API_URL || !env.UMAMI_WEBSITE_ID) return;

  const url = `${env.UMAMI_API_URL.replace(/\/+$/, "")}/api/send`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": SERVER_USER_AGENT },
      body: JSON.stringify({
        type: "event",
        payload: { website: env.UMAMI_WEBSITE_ID, hostname: hostname(), url: "/server", name, data },
      }),
    });
    if (!res.ok) {
      loggers.api.warn({ event: name, status: res.status }, "Umami server event rejected");
    }
  } catch (error) {
    loggers.api.warn(
      { event: name, error: error instanceof Error ? error.message : String(error) },
      "Umami server event failed",
    );
  }
}
