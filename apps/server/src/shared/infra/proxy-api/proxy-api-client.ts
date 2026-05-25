import type { AxiosInstance } from "axios";
import axios from "axios";
import { env } from "../env/env";
import { logger } from "../observability";

// --- Response types ---

export type NetworkType = "Residential" | "Business" | "Wireless" | "Hosting" | null;

export type ProxyCheckNetwork = {
  asn: string | null;
  range: string | null;
  hostname: string | null;
  provider: string | null;
  organisation: string | null;
  type: NetworkType;
};

export type ProxyCheckLocation = {
  continent_name: string | null;
  continent_code: string | null;
  country_name: string | null;
  country_code: string | null;
  region_name: string | null;
  region_code: string | null;
  city_name: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  currency: {
    name: string | null;
    code: string | null;
    symbol: string | null;
  } | null;
};

export type ProxyCheckDeviceEstimate = {
  address: number;
  subnet: number;
};

export type ProxyCheckDetections = {
  proxy: boolean;
  vpn: boolean;
  compromised: boolean;
  scraper: boolean;
  tor: boolean;
  hosting: boolean;
  anonymous: boolean;
  risk: number;
  confidence: number;
  first_seen: string | null;
  last_seen: string | null;
};

export type ProxyCheckDetectionHistory = {
  delisted: boolean;
  delist_datetime: string | null;
};

export type ProxyCheckAttackHistory = Record<string, number>;

export type ProxyCheckOperator = {
  name: string | null;
  url: string | null;
  anonymity: string | null;
  popularity: string | null;
  services: string[] | null;
  protocols: string[] | null;
  policies: {
    logging: boolean | null;
    paid_access: boolean | null;
  } | null;
  additional_operators: unknown | null;
};

export type ProxyCheckIpResult = {
  network: ProxyCheckNetwork;
  location: ProxyCheckLocation;
  device_estimate: ProxyCheckDeviceEstimate;
  detections: ProxyCheckDetections;
  detection_history: ProxyCheckDetectionHistory | null;
  attack_history: ProxyCheckAttackHistory | null;
  operator: ProxyCheckOperator | null;
  last_updated: string | null;
};

type ProxyCheckApiStatus = "ok" | "warning" | "denied" | "error";

type ProxyCheckApiResponse = {
  status: ProxyCheckApiStatus;
  message?: string;
} & Record<string, ProxyCheckIpResult | ProxyCheckApiStatus | string | undefined>;

// --- Assessment types ---

export type IpRiskAssessment = {
  ip: string;
  riskScore: number;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isHosting: boolean;
  isCompromised: boolean;
  networkType: NetworkType;
  provider: string | null;
  operatorName: string | null;
  confidence: number;
  isSuspicious: boolean;
};

// --- Client ---

const RISK_SCORE_THRESHOLD = 33;
const TIMEOUT_MS = 3_000;

export class ProxyApiClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "https://proxycheck.io/v3",
      timeout: TIMEOUT_MS,
      params: {
        key: env.PROXY_API_KEY,
      },
    });
  }

  async checkIp(ip: string): Promise<ProxyCheckIpResult | null> {
    try {
      const { data } = await this.client.get<ProxyCheckApiResponse>(
        `/${encodeURIComponent(ip)}`,
      );

      if (data.status !== "ok") return null;

      const result = data[ip] as ProxyCheckIpResult | undefined;
      return result ?? null;
    } catch (err) {
      logger.warn({ err, ip }, "proxycheck.io lookup failed");
      return null;
    }
  }

  async assessRisk(ip: string): Promise<IpRiskAssessment | null> {
    const result = await this.checkIp(ip);
    if (!result) return null;

    const d = result.detections;

    const isSuspicious =
      d.vpn || d.proxy || d.tor || d.hosting || d.compromised || d.risk >= RISK_SCORE_THRESHOLD;

    return {
      ip,
      riskScore: d.risk,
      isVpn: d.vpn,
      isProxy: d.proxy,
      isTor: d.tor,
      isHosting: d.hosting,
      isCompromised: d.compromised,
      networkType: result.network.type,
      provider: result.network.provider,
      operatorName: result.operator?.name ?? null,
      confidence: d.confidence,
      isSuspicious,
    };
  }

  async checkBatch(ips: string[]): Promise<Map<string, ProxyCheckIpResult>> {
    const results = new Map<string, ProxyCheckIpResult>();
    if (ips.length === 0) return results;

    try {
      const { data } = await this.client.post<ProxyCheckApiResponse>(
        "/",
        `ips=${ips.join(",")}`,
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
      );

      if (data.status !== "ok") return results;

      for (const ip of ips) {
        const result = data[ip] as ProxyCheckIpResult | undefined;
        if (result) {
          results.set(ip, result);
        }
      }
    } catch (err) {
      logger.warn({ err }, "proxycheck.io batch lookup failed");
    }

    return results;
  }
}

export const proxyApiClient = new ProxyApiClient();
