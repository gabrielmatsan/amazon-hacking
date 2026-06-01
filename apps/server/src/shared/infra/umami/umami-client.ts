import { env } from "../env/env";
import { redis } from "../databases/redis";
import { BadRequestError } from "../errors/bad-error-request";

// Self-hosted Umami exposes a token-based API: POST /api/auth/login returns a
// Bearer token that must accompany every data request. The token is long-lived
// but can expire/revoke, so we cache it in Redis (shared across instances) and
// transparently re-login on a 401.

const TOKEN_CACHE_KEY = "umami:token";

type UmamiConfig = {
  apiUrl: string;
  username: string;
  password: string;
  websiteId: string;
};

function requireConfig(): UmamiConfig {
  const { UMAMI_API_URL, UMAMI_USERNAME, UMAMI_PASSWORD, UMAMI_WEBSITE_ID } = env;

  if (!UMAMI_API_URL || !UMAMI_USERNAME || !UMAMI_PASSWORD || !UMAMI_WEBSITE_ID) {
    throw new BadRequestError("Umami analytics is not configured");
  }

  return {
    apiUrl: UMAMI_API_URL.replace(/\/+$/, ""),
    username: UMAMI_USERNAME,
    password: UMAMI_PASSWORD,
    websiteId: UMAMI_WEBSITE_ID,
  };
}

async function login(config: UmamiConfig): Promise<string> {
  const res = await fetch(`${config.apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: config.username, password: config.password }),
  });

  if (!res.ok) {
    throw new BadRequestError(`Umami login failed (${res.status})`);
  }

  const json = (await res.json()) as { token?: string };

  if (!json.token) {
    throw new BadRequestError("Umami login returned no token");
  }

  await redis.set(TOKEN_CACHE_KEY, json.token, "EX", env.UMAMI_TOKEN_TTL_SECONDS);
  return json.token;
}

async function getToken(config: UmamiConfig): Promise<string> {
  const cached = await redis.get(TOKEN_CACHE_KEY);
  return cached ?? login(config);
}

function buildUrl(config: UmamiConfig, path: string, params?: Record<string, string | number>): string {
  const url = new URL(`${config.apiUrl}/api${path}`);
  for (const [key, value] of Object.entries(params ?? {})) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

type Attempt<T> = (token: string) => Promise<{ status: number; data: T }>;

async function readResponse<T>(res: Response): Promise<{ status: number; data: T }> {
  const data = res.ok ? ((await res.json()) as T) : (null as T);
  return { status: res.status, data };
}

// Runs an authenticated attempt; on a 401 (expired/revoked token) it re-logs-in
// once and retries before giving up.
async function withAuthRetry<T>(config: UmamiConfig, attempt: Attempt<T>): Promise<{ status: number; data: T }> {
  let token = await getToken(config);
  let res = await attempt(token);

  if (res.status === 401) {
    await redis.del(TOKEN_CACHE_KEY);
    token = await login(config);
    res = await attempt(token);
  }

  return res;
}

export async function umamiGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const config = requireConfig();
  const url = buildUrl(config, path, params);

  const res = await withAuthRetry<T>(config, (token) =>
    fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }).then(readResponse<T>),
  );

  if (res.status < 200 || res.status >= 300) {
    throw new BadRequestError(`Umami request failed (${res.status}) for ${path}`);
  }

  return res.data;
}

export async function umamiPost<T>(path: string, body: unknown): Promise<T> {
  const config = requireConfig();
  const url = `${config.apiUrl}/api${path}`;

  const res = await withAuthRetry<T>(config, (token) =>
    fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).then(readResponse<T>),
  );

  if (res.status < 200 || res.status >= 300) {
    throw new BadRequestError(`Umami request failed (${res.status}) for ${path}`);
  }

  return res.data;
}

export function umamiWebsiteId(): string {
  return requireConfig().websiteId;
}
