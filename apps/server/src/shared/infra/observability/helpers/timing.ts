import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { logger } from "../logger";
import {
  dbQueryDuration,
  redisOperationDuration,
  externalApiDuration,
  externalApiRequestsTotal,
} from "../metrics/prometheus";
import { env } from "../../env/env";

function getTracer() {
  return trace.getTracer(env.OTEL_SERVICE_NAME, env.OTEL_SERVICE_VERSION);
}

interface TimingResult<T> {
  result: T;
  durationMs: number;
}

export async function withDbTiming<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(`db:${operation}`, { kind: SpanKind.CLIENT }, async (span) => {
    span.updateName(`db:${operation}`);
    span.setAttribute("db.system", "postgresql");
    span.setAttribute("db.operation", operation);
    span.setAttribute("db.sql.table", table);

    const start = performance.now();
    const end = dbQueryDuration.startTimer({ operation, table });

    try {
      const result = await fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      span.setAttribute("db.duration_ms", durationMs);
      span.setStatus({ code: SpanStatusCode.OK });

      logger.debug({ operation, table, durationMs }, `DB query completed: ${operation} ${table}`);

      return result;
    } catch (error) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      span.setAttribute("db.duration_ms", durationMs);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);

      logger.error(
        { operation, table, durationMs, error: (error as Error).message },
        `DB query failed: ${operation} ${table}`
      );

      throw error;
    } finally {
      end();
      span.end();
    }
  });
}

export async function withRedisTiming<T>(
  operation: string,
  command: string,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = getTracer();

  return tracer.startActiveSpan(`redis:${command}`, { kind: SpanKind.CLIENT }, async (span) => {
    span.updateName(`redis:${command}`);
    span.setAttribute("db.system", "redis");
    span.setAttribute("db.operation", operation);
    span.setAttribute("db.redis.command", command);

    const start = performance.now();
    const end = redisOperationDuration.startTimer({ operation, command });

    try {
      const result = await fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      span.setAttribute("db.duration_ms", durationMs);
      span.setStatus({ code: SpanStatusCode.OK });

      logger.debug({ operation, command, durationMs }, `Redis operation completed: ${command}`);

      return result;
    } catch (error) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      span.setAttribute("db.duration_ms", durationMs);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);

      logger.error(
        { operation, command, durationMs, error: (error as Error).message },
        `Redis operation failed: ${command}`
      );

      throw error;
    } finally {
      end();
      span.end();
    }
  });
}

interface ApiTimingOptions<T> {
  getStatusCode?: (result: T) => number;
  spanName?: string;
}

export async function withApiTiming<T>(
  service: string,
  endpoint: string,
  fn: () => Promise<T>,
  options?: ApiTimingOptions<T>
): Promise<T> {
  const tracer = getTracer();
  const spanName = options?.spanName ?? `api:${service}`;
  const getStatusCode = options?.getStatusCode;

  return tracer.startActiveSpan(spanName, { kind: SpanKind.CLIENT }, async (span) => {
    span.updateName(spanName);
    span.setAttribute("http.url", endpoint);
    span.setAttribute("peer.service", service);

    const start = performance.now();
    const end = externalApiDuration.startTimer({ service, endpoint });

    try {
      const result = await fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const statusCode = getStatusCode ? getStatusCode(result) : 200;

      span.setAttribute("http.status_code", statusCode);
      span.setAttribute("http.duration_ms", durationMs);
      span.setStatus({ code: SpanStatusCode.OK });

      externalApiRequestsTotal.labels({
        service,
        endpoint,
        status_code: statusCode.toString(),
      }).inc();

      logger.debug(
        { service, endpoint, durationMs, statusCode },
        `External API call completed: ${service}${endpoint}`
      );

      return result;
    } catch (error) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      span.setAttribute("http.status_code", 500);
      span.setAttribute("http.duration_ms", durationMs);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);

      externalApiRequestsTotal.labels({
        service,
        endpoint,
        status_code: "500",
      }).inc();

      logger.error(
        { service, endpoint, durationMs, error: (error as Error).message },
        `External API call failed: ${service}${endpoint}`
      );

      throw error;
    } finally {
      end();
      span.end();
    }
  });
}

export async function withTiming<T>(
  operationName: string,
  fn: () => Promise<T>
): Promise<TimingResult<T>> {
  const tracer = getTracer();

  return tracer.startActiveSpan(operationName, { kind: SpanKind.INTERNAL }, async (span) => {
    span.updateName(operationName);
    const start = performance.now();

    try {
      const result = await fn();
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      span.setAttribute("duration_ms", durationMs);
      span.setStatus({ code: SpanStatusCode.OK });

      logger.debug({ operation: operationName, durationMs }, `${operationName} completed`);

      return { result, durationMs };
    } catch (error) {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;

      span.setAttribute("duration_ms", durationMs);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      span.recordException(error as Error);

      logger.error(
        { operation: operationName, durationMs, error: (error as Error).message },
        `${operationName} failed`
      );

      throw error;
    } finally {
      span.end();
    }
  });
}

export const timed = withTiming;
