import { type Span, context, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { logger } from "../logger";
import {
  httpRequestDuration,
  httpRequestsInFlight,
  httpRequestsTotal,
} from "../metrics/prometheus";
import { getTraceContext } from "../telemetry";
import { env } from "../../env/env";

function getTracer() {
  return trace.getTracer(env.OTEL_SERVICE_NAME, env.OTEL_SERVICE_VERSION);
}

function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
}

function normalizePath(url: string): string {
  try {
    const urlObj = new URL(url);
    let path = urlObj.pathname;

    path = path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ":id"
    );
    path = path.replace(/\/\d+/g, "/:id");
    path = path.replace(/\/[a-z][a-z0-9]{20,30}/gi, "/:id");

    return path;
  } catch {
    return url.split("?")[0];
  }
}

function shouldSkip(path: string): boolean {
  return path === "/health" || path === "/metrics" || path === "/" ||
    path === "/favicon.ico" || path.startsWith("/health/");
}

export interface RequestContext {
  requestId: string;
  traceId?: string;
  spanId?: string;
  startTime: number;
  span?: Span;
  otelContext?: ReturnType<typeof context.active>;
}

const requestContextMap = new WeakMap<Request, RequestContext>();

export function onRequestHandler({ request }: { request: Request }) {
  const requestId =
    request.headers.get("x-request-id") ||
    request.headers.get("x-correlation-id") ||
    generateRequestId();

  const path = normalizePath(request.url);
  const method = request.method;

  const span = getTracer().startSpan(`${method} ${path}`, {
    kind: SpanKind.SERVER,
    attributes: {
      "http.method": method,
      "http.url": request.url,
      "http.route": path,
      "http.scheme": new URL(request.url).protocol.replace(":", ""),
      "http.host": request.headers.get("host") || "",
      "http.user_agent": request.headers.get("user-agent") || "",
      "http.request_id": requestId,
    },
  });

  const spanContext = span.spanContext();
  const otelContext = trace.setSpan(context.active(), span);

  const reqContext: RequestContext = {
    requestId,
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    startTime: performance.now(),
    span,
    otelContext,
  };

  requestContextMap.set(request, reqContext);

  httpRequestsInFlight.labels({ method }).inc();

  if (!shouldSkip(path)) {
    logger.debug(
      { requestId, traceId: spanContext.traceId, method, url: path },
      "Incoming request"
    );
  }
}

export function onAfterResponseHandler({
  request,
  set,
}: {
  request: Request;
  set: { status?: number | string; headers: Record<string, string | number | undefined> };
}) {
  const requestContext = requestContextMap.get(request);
  const method = request.method;
  const path = normalizePath(request.url);
  const statusCode = typeof set.status === "number" ? set.status : 200;

  if (requestContext?.span) {
    const span = requestContext.span;
    span.setAttribute("http.status_code", statusCode);

    if (statusCode >= 400) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: `HTTP ${statusCode}` });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }

    span.end();
  }

  httpRequestsInFlight.labels({ method }).dec();

  if (requestContext?.requestId) {
    set.headers["x-request-id"] = requestContext.requestId;
  }
  if (requestContext?.traceId) {
    set.headers["x-trace-id"] = requestContext.traceId;
  }

  requestContextMap.delete(request);

  if (shouldSkip(path)) return;

  const durationMs = requestContext?.startTime
    ? Math.round((performance.now() - requestContext.startTime) * 100) / 100
    : 0;

  httpRequestsTotal.labels({
    method,
    route: path,
    status_code: statusCode.toString(),
  }).inc();

  if (requestContext?.startTime) {
    const durationSeconds = (performance.now() - requestContext.startTime) / 1000;
    httpRequestDuration.labels({
      method,
      route: path,
      status_code: statusCode.toString(),
    }).observe(durationSeconds);
  }

  const logData = {
    requestId: requestContext?.requestId,
    traceId: requestContext?.traceId,
    method,
    url: path,
    status: statusCode,
    durationMs,
  };

  if (statusCode >= 500) {
    logger.error(logData, "Request completed with server error");
  } else if (statusCode >= 400) {
    logger.warn(logData, "Request completed with client error");
  } else {
    logger.info(logData, "Request completed");
  }
}

export function getRequestContext(request: Request): RequestContext | undefined {
  return requestContextMap.get(request);
}

export function withRequestContext<T>(
  request: Request,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const reqContext = requestContextMap.get(request);
  if (!reqContext?.otelContext) {
    return fn();
  }
  return context.with(reqContext.otelContext, fn);
}

export function withSpan<T>(
  request: Request,
  name: string,
  fn: (span: Span) => T | Promise<T>,
  attributes?: Record<string, string | number | boolean>
): T | Promise<T> {
  const reqContext = requestContextMap.get(request);
  const otelCtx = reqContext?.otelContext ?? context.active();

  return context.with(otelCtx, () => {
    return getTracer().startActiveSpan(name, async (span) => {
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
  });
}
