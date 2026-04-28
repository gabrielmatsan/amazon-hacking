import {
  Registry,
  Counter,
  Histogram,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

const METRICS_ENABLED = process.env.METRICS_ENABLED !== "false";
const METRICS_PREFIX = process.env.METRICS_PREFIX || "my_api";

export const metricsRegistry = new Registry();

metricsRegistry.setDefaultLabels({
  app: METRICS_PREFIX,
});

if (METRICS_ENABLED) {
  collectDefaultMetrics({
    register: metricsRegistry,
    prefix: `${METRICS_PREFIX}_`,
  });
}

// HTTP Request Metrics
export const httpRequestsTotal = new Counter({
  name: `${METRICS_PREFIX}_http_requests_total`,
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [metricsRegistry],
});

export const httpRequestDuration = new Histogram({
  name: `${METRICS_PREFIX}_http_request_duration_seconds`,
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

export const httpRequestsInFlight = new Gauge({
  name: `${METRICS_PREFIX}_http_requests_in_flight`,
  help: "Number of HTTP requests currently being processed",
  labelNames: ["method"] as const,
  registers: [metricsRegistry],
});

// Database Metrics
export const dbQueryDuration = new Histogram({
  name: `${METRICS_PREFIX}_db_query_duration_seconds`,
  help: "Database query duration in seconds",
  labelNames: ["operation", "table"] as const,
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export const dbConnectionsActive = new Gauge({
  name: `${METRICS_PREFIX}_db_connections_active`,
  help: "Number of active database connections",
  registers: [metricsRegistry],
});

// Redis Cache Metrics
export const redisCacheHits = new Counter({
  name: `${METRICS_PREFIX}_redis_cache_hits_total`,
  help: "Total number of Redis cache hits",
  labelNames: ["operation"] as const,
  registers: [metricsRegistry],
});

export const redisCacheMisses = new Counter({
  name: `${METRICS_PREFIX}_redis_cache_misses_total`,
  help: "Total number of Redis cache misses",
  labelNames: ["operation"] as const,
  registers: [metricsRegistry],
});

export const redisOperationDuration = new Histogram({
  name: `${METRICS_PREFIX}_redis_operation_duration_seconds`,
  help: "Redis operation duration in seconds",
  labelNames: ["operation", "command"] as const,
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25],
  registers: [metricsRegistry],
});

// External API Metrics
export const externalApiRequestsTotal = new Counter({
  name: `${METRICS_PREFIX}_external_api_requests_total`,
  help: "Total number of external API requests",
  labelNames: ["service", "endpoint", "status_code"] as const,
  registers: [metricsRegistry],
});

export const externalApiDuration = new Histogram({
  name: `${METRICS_PREFIX}_external_api_duration_seconds`,
  help: "External API request duration in seconds",
  labelNames: ["service", "endpoint"] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
  registers: [metricsRegistry],
});

export const metrics = {
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestsInFlight,
  dbQueryDuration,
  dbConnectionsActive,
  redisCacheHits,
  redisCacheMisses,
  redisOperationDuration,
  externalApiRequestsTotal,
  externalApiDuration,
  registry: metricsRegistry,
};

export async function getMetrics(): Promise<string> {
  return metricsRegistry.metrics();
}

export function getMetricsContentType(): string {
  return metricsRegistry.contentType;
}
