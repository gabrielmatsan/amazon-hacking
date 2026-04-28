import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import Redis from "ioredis";
import { env } from "../env/env";
import { loggers } from "../observability/logger";
import {
  redisCacheHits,
  redisCacheMisses,
  redisOperationDuration,
} from "../observability/metrics/prometheus";

// ============================================================================
// TIPOS E CONSTANTES
// ============================================================================

interface CacheOptions {
  /** TTL em segundos (default: 60) */
  ttl?: number;
  /** Timeout em milissegundos para busca no cache. Se exceder, vai direto pro fallback */
  timeout?: number;
  /** Nome customizado para o span (default: "cache:get") */
  spanName?: string;
}

interface CacheTTLProps {
  time: number;
  type: "days" | "hours" | "minutes" | "seconds";
}

const CACHE_TIMEOUT = Symbol("CACHE_TIMEOUT");

// ============================================================================
// CONFIGURACAO DO CLIENT REDIS
// ============================================================================

const log = loggers.redis;

const redis = new Redis(env.REDIS_URL, {
  family: 4,
  retryStrategy: (times) => Math.min(times * 50, 1000),
  maxRetriesPerRequest: 3,
  ...(env.REDIS_TLS && {
    tls: { rejectUnauthorized: true },
  }),
  showFriendlyErrorStack: true,
});

redis.on("error", (error) => log.error({ error: error.message }, "Redis error"));
redis.on("connect", () => log.info("Redis connected"));
redis.on("reconnecting", () => log.warn("Redis reconnecting"));
redis.on("ready", () => log.info("Redis ready"));
redis.on("close", () => log.warn("Redis closed"));
redis.on("end", () => log.warn("Redis end"));

// ============================================================================
// HELPERS
// ============================================================================

function getTracer() {
  return trace.getTracer(env.OTEL_SERVICE_NAME, env.OTEL_SERVICE_VERSION);
}

function measureDuration(start: number): number {
  return Math.round((performance.now() - start) * 100) / 100;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | typeof CACHE_TIMEOUT> {
  const timeout = new Promise<typeof CACHE_TIMEOUT>((resolve) =>
    setTimeout(() => resolve(CACHE_TIMEOUT), ms)
  );
  return Promise.race([promise, timeout]);
}

function cacheTTL({ time, type }: CacheTTLProps): number {
  const multipliers = {
    days: 24 * 60 * 60,
    hours: 60 * 60,
    minutes: 60,
    seconds: 1,
  };
  return time * multipliers[type];
}

function ttlUntilMidnightBRT(): number {
  const now = new Date();
  const midnightBRT = new Date(now);
  midnightBRT.setUTCHours(3, 0, 0, 0);

  if (now.getTime() >= midnightBRT.getTime()) {
    midnightBRT.setUTCDate(midnightBRT.getUTCDate() + 1);
  }

  const diffMs = midnightBRT.getTime() - now.getTime();
  return Math.ceil(diffMs / 1000);
}

// ============================================================================
// ESTRATEGIAS DE CACHE
// ============================================================================

async function cacheFirst<T>(key: string, fallback: () => Promise<T>, options: CacheOptions | number = 60): Promise<T> {
  const tracer = getTracer();
  const ttl = typeof options === "number" ? options : (options.ttl ?? 60);
  const timeout = typeof options === "number" ? undefined : options.timeout;
  const spanName = typeof options === "number" ? "cache:get" : (options.spanName ?? "cache:get");

  return tracer.startActiveSpan(spanName, { kind: SpanKind.INTERNAL }, async (span) => {
    span.updateName(spanName);
    span.setAttribute("db.system", "redis");
    span.setAttribute("cache.key", key);
    span.setAttribute("cache.ttl", ttl);

    if (timeout) span.setAttribute("cache.timeout_ms", timeout);

    const startRedis = performance.now();

    try {
      const cachePromise = redis.get(key);

      const cached = timeout
        ? await withTimeout(cachePromise, timeout)
        : await cachePromise;

      const redisDuration = measureDuration(startRedis);
      redisOperationDuration.labels({ operation: "cacheFirst", command: "get" }).observe(redisDuration / 1000);

      if (cached === CACHE_TIMEOUT) {
        redisCacheMisses.labels({ operation: "cacheFirst" }).inc();
        span.setAttribute("cache.hit", false);
        span.setAttribute("cache.timeout", true);
        span.setAttribute("cache.duration_ms", redisDuration);
        log.warn({ key, durationMs: redisDuration, timeoutMs: timeout }, "Cache timeout - falling back to source");

        const startFallback = performance.now();
        const result = await fallback();
        span.setAttribute("cache.fallback_duration_ms", measureDuration(startFallback));
        span.setStatus({ code: SpanStatusCode.OK });

        redis.set(key, JSON.stringify(result), "EX", ttl).catch((err) => {
          log.error({ key, error: err.message }, "Failed to set cache after timeout");
        });

        return result;
      }

      if (cached) {
        redisCacheHits.labels({ operation: "cacheFirst" }).inc();
        span.setAttribute("cache.hit", true);
        span.setAttribute("cache.duration_ms", redisDuration);
        span.setStatus({ code: SpanStatusCode.OK });
        log.info({ key, durationMs: redisDuration, hit: true }, "Cache hit");
        return JSON.parse(cached);
      }

      redisCacheMisses.labels({ operation: "cacheFirst" }).inc();
      span.setAttribute("cache.hit", false);

      const startFallback = performance.now();
      const result = await fallback();
      const fallbackDuration = measureDuration(startFallback);
      span.setAttribute("cache.fallback_duration_ms", fallbackDuration);

      const startSet = performance.now();
      await redis.set(key, JSON.stringify(result), "EX", ttl);
      const setDuration = measureDuration(startSet);

      redisOperationDuration.labels({ operation: "cacheFirst", command: "set" }).observe(setDuration / 1000);
      span.setAttribute("cache.set_duration_ms", setDuration);
      span.setStatus({ code: SpanStatusCode.OK });

      log.info(
        { key, redisDurationMs: redisDuration, fallbackDurationMs: fallbackDuration, hit: false, ttl },
        "Cache miss - fetched from source"
      );

      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

async function cacheForever<T>(key: string, fallback: () => Promise<T>, spanName = "cache:forever"): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(spanName, { kind: SpanKind.INTERNAL }, async (span) => {
    span.updateName(spanName);
    span.setAttribute("db.system", "redis");
    span.setAttribute("cache.key", key);
    span.setAttribute("cache.ttl", -1);

    const startRedis = performance.now();

    try {
      const cached = await redis.get(key);
      const redisDuration = measureDuration(startRedis);
      redisOperationDuration.labels({ operation: "cacheForever", command: "get" }).observe(redisDuration / 1000);

      if (cached) {
        redisCacheHits.labels({ operation: "cacheForever" }).inc();
        span.setAttribute("cache.hit", true);
        span.setAttribute("cache.duration_ms", redisDuration);
        span.setStatus({ code: SpanStatusCode.OK });
        log.info({ key, durationMs: redisDuration, hit: true }, "Cache hit (forever)");
        return JSON.parse(cached);
      }

      redisCacheMisses.labels({ operation: "cacheForever" }).inc();
      span.setAttribute("cache.hit", false);

      const startFallback = performance.now();
      const result = await fallback();
      const fallbackDuration = measureDuration(startFallback);
      span.setAttribute("cache.fallback_duration_ms", fallbackDuration);

      const startSet = performance.now();
      await redis.set(key, JSON.stringify(result));
      const setDuration = measureDuration(startSet);

      redisOperationDuration.labels({ operation: "cacheForever", command: "set" }).observe(setDuration / 1000);
      span.setAttribute("cache.set_duration_ms", setDuration);
      span.setStatus({ code: SpanStatusCode.OK });

      log.info(
        { key, redisDurationMs: redisDuration, fallbackDurationMs: fallbackDuration, hit: false },
        "Cache miss (forever) - fetched from source"
      );

      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

async function invalidateCache(pattern: string): Promise<void> {
  const tracer = getTracer();

  return tracer.startActiveSpan("cache:invalidate", { kind: SpanKind.INTERNAL }, async (span) => {
    span.updateName("cache:invalidate");
    span.setAttribute("db.system", "redis");
    span.setAttribute("cache.pattern", pattern);

    try {
      const start = performance.now();
      const keys = await redis.keys(pattern);
      span.setAttribute("cache.keys_found", keys.length);

      if (keys.length > 0) {
        await redis.del(...keys);
        const duration = measureDuration(start);
        span.setAttribute("cache.keys_deleted", keys.length);
        span.setAttribute("cache.duration_ms", duration);
        log.info({ pattern, keysDeleted: keys.length, durationMs: duration }, "Cache invalidated");
      }

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

async function hashCache<T>(hashKey: string, field: string, fallback: () => Promise<T>, spanName = "cache:hash"): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(spanName, { kind: SpanKind.INTERNAL }, async (span) => {
    span.updateName(spanName);
    span.setAttribute("db.system", "redis");
    span.setAttribute("cache.key", hashKey);
    span.setAttribute("cache.field", field);

    const startRedis = performance.now();

    try {
      const cached = await redis.hget(hashKey, field);
      const redisDuration = measureDuration(startRedis);
      redisOperationDuration.labels({ operation: "hashCache", command: "hget" }).observe(redisDuration / 1000);

      if (cached) {
        redisCacheHits.labels({ operation: "hashCache" }).inc();
        span.setAttribute("cache.hit", true);
        span.setAttribute("cache.duration_ms", redisDuration);
        span.setStatus({ code: SpanStatusCode.OK });
        log.info({ hashKey, field, durationMs: redisDuration, hit: true }, "Hash cache hit");
        return JSON.parse(cached);
      }

      redisCacheMisses.labels({ operation: "hashCache" }).inc();
      span.setAttribute("cache.hit", false);

      const startFallback = performance.now();
      const result = await fallback();
      const fallbackDuration = measureDuration(startFallback);
      span.setAttribute("cache.fallback_duration_ms", fallbackDuration);

      const startSet = performance.now();
      await redis.hset(hashKey, field, JSON.stringify(result));
      const setDuration = measureDuration(startSet);

      redisOperationDuration.labels({ operation: "hashCache", command: "hset" }).observe(setDuration / 1000);
      span.setAttribute("cache.set_duration_ms", setDuration);
      span.setStatus({ code: SpanStatusCode.OK });

      log.info(
        { hashKey, field, redisDurationMs: redisDuration, fallbackDurationMs: fallbackDuration, hit: false },
        "Hash cache miss - fetched from source"
      );

      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

async function getCacheVersion(namespace: string): Promise<string> {
  return await redis.get(`${namespace}:v`) ?? "0";
}

async function bumpCacheVersion(namespace: string): Promise<void> {
  await redis.incr(`${namespace}:v`);
}

export { bumpCacheVersion, cacheFirst, cacheForever, cacheTTL, getCacheVersion, hashCache, invalidateCache, redis, ttlUntilMidnightBRT };
