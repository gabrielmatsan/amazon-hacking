// IMPORTANT: Initialize telemetry FIRST before any other imports
import { initTelemetry, shutdownTelemetry } from "./shared/infra/observability/telemetry";
initTelemetry();

import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { appRoutes } from "./app.routes";
import { shutdownPools } from "./shared/infra/databases/postgres";
import { redis } from "./shared/infra/databases/redis";
import { env } from "./shared/infra/env/env";
import { healthChecker } from "./shared/infra/observability/health";
import { logger } from "./shared/infra/observability/logger";
import { getMetrics, getMetricsContentType } from "./shared/infra/observability/metrics/prometheus";
import { onAfterResponseHandler, onRequestHandler } from "./shared/infra/observability/middleware";
import { stopEmailQueue } from "./shared/infra/queues/bullmq/mail/email-queue";
import { startEmailWorker, stopEmailWorker } from "./shared/infra/queues/bullmq/mail/email-worker";
import { RateLimitContext } from "./shared/infra/rate-limiting/rate-limit";
import { initializeSES } from "./shared/mail/ses/ses-setup";

const app = new Elysia({
  normalize: "typebox",
  serve: {
    idleTimeout: 255,
    hostname: "0.0.0.0",
  }
})
  .onRequest(onRequestHandler)
  .onAfterResponse(onAfterResponseHandler)
  // .use(rateLimit({
  //   context: new RateLimitContext(),
  //   duration: 1000 * 60 * 1 + 1000 * 30,
  //   max: 100,
  //   generator: (request: Request) => {
  //     return (
  //       request.headers.get("cf-connecting-ip") ??
  //       request.headers.get("x-forwarded-for") ??
  //       request.headers.get("x-real-ip") ??
  //       "unknown"
  //     );
  //   },
  //   skip: (request: Request) => {
  //     if (env.NODE_ENV === "development") return true;
  //     return request.url.includes("/health") || request.url.includes("/metrics") || request.url.includes("/docs");
  //   },
  //   errorResponse: new Response(JSON.stringify({
  //     error: "failed",
  //     message: "Rate limit exceeded",
  //   }), {
  //     status: 429,
  //     headers: { "content-type": "application/json" }
  //   })
  // }))
  .use(
    cors({
      credentials: true,
      allowedHeaders: ["content-type", "authorization", "accept", "x-requested-with", "x-request-id"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
      origin: (request: Request): boolean => {
        if (env.NODE_ENV === "production") {
          const allowedOrigins = [
            env.FRONTEND_URL,
          ];

          const origin = request.headers.get("origin") ?? "";
          return allowedOrigins.includes(origin);
        }
        return true;
      },
    })
  )
  .get("/health", async () => {
    const health = await healthChecker.check();
    return health;
  })
  .get("/metrics", async ({ set }) => {
    set.headers["content-type"] = getMetricsContentType();
    return getMetrics();
  });

if (env.NODE_ENV === "development") {
  app.use(
    swagger({
      swaggerOptions: {
        deepLinking: true,
        withCredentials: true,
      },
      documentation: {
        servers: [
          {
            url: `http://localhost:${env.PORT}`,
            description: "Development Server",
          },
        ],
        info: {
          title: "API",
          version: "1.0.0",
          description: "API Documentation",
        },
      },
      path: "/docs",
    })
  );
}

app.use(appRoutes);
app.listen(env.PORT);

// Initialize email service
// initializeSES();
// logger.info("Email service initialized");
// startEmailWorker();
// logger.info("Email worker started");

export type App = typeof app;

logger.info({
  port: app.server?.port,
  environment: env.NODE_ENV,
  version: env.OTEL_SERVICE_VERSION,
  docsUrl: env.NODE_ENV === "development" ? `http://localhost:${app.server?.port}/docs` : undefined,
}, "API started");

if (env.NODE_ENV === "development") {
  console.log(
    `  API Server
  Time: ${new Date().toISOString()}
  Version: ${env.OTEL_SERVICE_VERSION}
  Environment: ${env.NODE_ENV}
  Port: ${app.server?.port}
  URL: http://localhost:${app.server?.port}
  Docs: http://localhost:${app.server?.port}/docs
  Metrics: http://localhost:${app.server?.port}/metrics
  Health: http://localhost:${app.server?.port}/health
  `
  );
}

// Graceful shutdown
let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ signal }, "Received signal, shutting down gracefully...");

  // await stopEmailWorker();
  // logger.info("Email worker stopped");

  // await stopEmailQueue();
  // logger.info("Email queue stopped");

  await shutdownPools();
  logger.info("Database pools closed");

  try {
    await redis.quit();
    logger.info("Redis connection closed");
  } catch {
    // Redis already closed
  }

  await shutdownTelemetry();

  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
