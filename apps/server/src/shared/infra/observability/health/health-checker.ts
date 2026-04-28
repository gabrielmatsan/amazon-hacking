import { redis } from "../../databases/redis";
import { db } from "../../databases/postgres";
import { sql } from "drizzle-orm";

export interface DependencyHealth {
  status: "healthy" | "unhealthy" | "degraded";
  latencyMs?: number;
  message?: string;
}

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  dependencies: {
    postgres: DependencyHealth;
    redis: DependencyHealth;
  };
}

const startTime = Date.now();

async function checkPostgres(): Promise<DependencyHealth> {
  const start = performance.now();
  try {
    await db.execute(sql`SELECT 1`);
    const latencyMs = Math.round(performance.now() - start);
    return {
      status: latencyMs > 1000 ? "degraded" : "healthy",
      latencyMs,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkRedis(): Promise<DependencyHealth> {
  const start = performance.now();
  try {
    await redis.ping();
    const latencyMs = Math.round(performance.now() - start);
    return {
      status: latencyMs > 500 ? "degraded" : "healthy",
      latencyMs,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function determineOverallStatus(
  dependencies: HealthStatus["dependencies"]
): HealthStatus["status"] {
  const statuses = Object.values(dependencies).map((d) => d.status);

  if (statuses.some((s) => s === "unhealthy")) return "unhealthy";
  if (statuses.some((s) => s === "degraded")) return "degraded";
  return "healthy";
}

export const healthChecker = {
  async check(): Promise<HealthStatus> {
    const [postgres, redisHealth] = await Promise.all([
      checkPostgres(),
      checkRedis(),
    ]);

    const dependencies = { postgres, redis: redisHealth };

    return {
      status: determineOverallStatus(dependencies),
      timestamp: new Date().toISOString(),
      uptime: Math.round((Date.now() - startTime) / 1000),
      version: process.env.OTEL_SERVICE_VERSION || "1.0.0",
      dependencies,
    };
  },

  async liveness(): Promise<{ status: "ok" }> {
    return { status: "ok" };
  },

  async readiness(): Promise<{ ready: boolean; checks: HealthStatus["dependencies"] }> {
    const [postgres, redisHealth] = await Promise.all([
      checkPostgres(),
      checkRedis(),
    ]);

    const checks = { postgres, redis: redisHealth };
    const ready = Object.values(checks).every((c) => c.status !== "unhealthy");

    return { ready, checks };
  },
};
