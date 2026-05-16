import { isIP } from "node:net";

const DEFAULT_IP_LOCATION_ENDPOINT = "https://ipapi.co";
const DEFAULT_TIMEOUT_MS = 2_000;

type FetchLike = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type IpApiResponse = {
  ip?: string;
  city?: string | null;
  region?: string | null;
  region_code?: string | null;
  country?: string | null;
  country_name?: string | null;
  continent_code?: string | null;
  postal?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  timezone?: string | null;
  asn?: string | null;
  org?: string | null;
  error?: boolean;
  reason?: string;
};

export type IpLocation = {
  ip: string;
  city: string | null;
  region: string | null;
  regionCode: string | null;
  country: string | null;
  countryName: string | null;
  continentCode: string | null;
  postal: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  asn: string | null;
  org: string | null;
  source: "ipapi.co";
};

type GetIpLocationOptions = {
  endpoint?: string;
  fetcher?: FetchLike;
  timeoutMs?: number;
};

export function normalizeIpAddress(ipAddress: string | null | undefined): string | null {
  if (!ipAddress) return null;

  let normalized = ipAddress.trim();
  if (!normalized || normalized === "unknown") return null;

  if (normalized.startsWith("[") && normalized.includes("]")) {
    normalized = normalized.slice(1, normalized.indexOf("]"));
  }

  if (/^\d{1,3}(\.\d{1,3}){3}:\d+$/.test(normalized)) {
    normalized = normalized.slice(0, normalized.lastIndexOf(":"));
  }

  if (normalized.startsWith("::ffff:")) {
    normalized = normalized.slice("::ffff:".length);
  }

  return isIP(normalized) ? normalized : null;
}

export function isPublicIpAddress(ipAddress: string): boolean {
  const ipVersion = isIP(ipAddress);
  if (ipVersion === 4) return isPublicIpv4(ipAddress);
  if (ipVersion === 6) return isPublicIpv6(ipAddress);
  return false;
}

export async function getIpLocation(
  ipAddress: string | null | undefined,
  options: GetIpLocationOptions = {},
): Promise<IpLocation | null> {
  const normalizedIp = normalizeIpAddress(ipAddress);
  if (!normalizedIp || !isPublicIpAddress(normalizedIp)) return null;

  const fetcher = options.fetcher ?? fetch;
  const endpoint = (options.endpoint ?? DEFAULT_IP_LOCATION_ENDPOINT).replace(/\/+$/, "");
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(`${endpoint}/${encodeURIComponent(normalizedIp)}/json/`, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as IpApiResponse;
    if (data.error) return null;

    return {
      ip: data.ip ?? normalizedIp,
      city: data.city ?? null,
      region: data.region ?? null,
      regionCode: data.region_code ?? null,
      country: data.country ?? null,
      countryName: data.country_name ?? null,
      continentCode: data.continent_code ?? null,
      postal: data.postal ?? null,
      latitude: toNumberOrNull(data.latitude),
      longitude: toNumberOrNull(data.longitude),
      timezone: data.timezone ?? null,
      asn: data.asn ?? null,
      org: data.org ?? null,
      source: "ipapi.co",
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function isPublicIpv4(ipAddress: string): boolean {
  const parts = ipAddress.split(".").map(Number);
  const [first, second, third] = parts;

  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;

  if (first === 0 || first === 10 || first === 127) return false;
  if (first === 100 && second >= 64 && second <= 127) return false;
  if (first === 169 && second === 254) return false;
  if (first === 172 && second >= 16 && second <= 31) return false;
  if (first === 192 && second === 168) return false;
  if (first === 192 && second === 0 && third === 0) return false;
  if (first === 192 && second === 0 && third === 2) return false;
  if (first === 198 && (second === 18 || second === 19)) return false;
  if (first === 198 && second === 51 && third === 100) return false;
  if (first === 203 && second === 0 && third === 113) return false;
  if (first >= 224) return false;

  return true;
}

function isPublicIpv6(ipAddress: string): boolean {
  const normalized = ipAddress.toLowerCase();
  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  );
}

function toNumberOrNull(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
