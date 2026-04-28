import type { Span } from "@opentelemetry/api";
import {
  context,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { IORedisInstrumentation } from "@opentelemetry/instrumentation-ioredis";
import { PgInstrumentation } from "@opentelemetry/instrumentation-pg";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

import { env } from "../env/env";

const ATTR_DEPLOYMENT_ENVIRONMENT = "deployment.environment";

let sdk: NodeSDK | null = null;
let isInitialized = false;

function parseOtlpHeaders(headersString?: string): Record<string, string> {
  if (!headersString) return {};

  const headers: Record<string, string> = {};
  const pairs = headersString.split(",");

  for (const pair of pairs) {
    const [key, ...valueParts] = pair.split("=");
    if (key && valueParts.length > 0) {
      headers[key.trim()] = valueParts.join("=").trim();
    }
  }

  return headers;
}

function getDiagLogLevel(level: string): DiagLogLevel {
  const levels: Record<string, DiagLogLevel> = {
    none: DiagLogLevel.NONE,
    error: DiagLogLevel.ERROR,
    warn: DiagLogLevel.WARN,
    info: DiagLogLevel.INFO,
    debug: DiagLogLevel.DEBUG,
    verbose: DiagLogLevel.VERBOSE,
    all: DiagLogLevel.ALL,
  };
  return levels[level.toLowerCase()] ?? DiagLogLevel.NONE;
}

export function initTelemetry(): void {
  if (isInitialized) {
    console.log("[telemetry] OpenTelemetry already initialized");
    return;
  }

  if (!env.OTEL_ENABLED_COMPUTED) {
    console.log(`[telemetry] OpenTelemetry disabled (NODE_ENV=${env.NODE_ENV}, OTEL_ENABLED=${env.OTEL_ENABLED || "not set"})`);
    return;
  }

  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    console.log("[telemetry] OpenTelemetry disabled: OTEL_EXPORTER_OTLP_ENDPOINT not set");
    return;
  }

  if (env.OTEL_LOG_LEVEL !== "none") {
    diag.setLogger(new DiagConsoleLogger(), getDiagLogLevel(env.OTEL_LOG_LEVEL));
  }

  const headers = parseOtlpHeaders(env.OTEL_EXPORTER_OTLP_HEADERS);

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: env.OTEL_SERVICE_VERSION,
    [ATTR_DEPLOYMENT_ENVIRONMENT]: env.OTEL_ENVIRONMENT_COMPUTED,
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
    headers,
  });

  const metricExporter = new OTLPMetricExporter({
    url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
    headers,
  });

  const logExporter = new OTLPLogExporter({
    url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
    headers,
  });

  sdk = new NodeSDK({
    resource,
    serviceName: env.OTEL_SERVICE_NAME,
    traceExporter,
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: env.OTEL_METRICS_EXPORT_INTERVAL_MS,
    }),
    logRecordProcessors: [new BatchLogRecordProcessor(logExporter)],
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (request) => {
          const url = request.url || "";
          return url === "/health" || url === "/metrics" || url === "/";
        },
      }),
      new PgInstrumentation({
        enhancedDatabaseReporting: true,
      }),
      new IORedisInstrumentation(),
    ],
  });

  sdk.start();
  isInitialized = true;

  console.log("[telemetry] OpenTelemetry initialized");
  console.log(`[telemetry]   Service: ${env.OTEL_SERVICE_NAME} v${env.OTEL_SERVICE_VERSION}`);
  console.log(`[telemetry]   Environment: ${env.OTEL_ENVIRONMENT_COMPUTED}`);
  console.log(`[telemetry]   Endpoint: ${env.OTEL_EXPORTER_OTLP_ENDPOINT}`);
  console.log("[telemetry]   Signals: traces, metrics, logs");
}

export async function shutdownTelemetry(): Promise<void> {
  if (!sdk) return;

  try {
    await sdk.shutdown();
    console.log("[telemetry] OpenTelemetry shutdown complete");
  } catch (error) {
    console.error("[telemetry] Error during shutdown:", error);
  }
}

export function getCurrentSpan(): Span | undefined {
  return trace.getActiveSpan();
}

export function getTraceContext(): { traceId?: string; spanId?: string } {
  const span = trace.getActiveSpan();
  if (!span) return {};

  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

export function createSpan<T>(
  name: string,
  fn: (span: Span) => T | Promise<T>,
  attributes?: Record<string, string | number | boolean>
): T | Promise<T> {
  const tracer = trace.getTracer(env.OTEL_SERVICE_NAME);

  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        span.setAttributes(attributes);
      }
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
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

const pinoLevelToSeverity: Record<string, SeverityNumber> = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

export function emitOtelLog(
  level: string,
  message: string,
  attributes?: Record<string, unknown>
): void {
  if (!isInitialized) return;

  const otelLogger = logs.getLogger(env.OTEL_SERVICE_NAME);
  const severityNumber = pinoLevelToSeverity[level] || SeverityNumber.INFO;
  const severityText = level.toUpperCase();

  const span = trace.getActiveSpan();
  const spanContext = span?.spanContext();

  otelLogger.emit({
    severityNumber,
    severityText,
    body: message,
    attributes: {
      ...attributes,
      "service.name": env.OTEL_SERVICE_NAME,
      "service.version": env.OTEL_SERVICE_VERSION,
      "deployment.environment": env.OTEL_ENVIRONMENT_COMPUTED,
    },
    ...(spanContext && {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    }),
  });
}

export { context, SeverityNumber, SpanStatusCode, trace };
export type { Span };
