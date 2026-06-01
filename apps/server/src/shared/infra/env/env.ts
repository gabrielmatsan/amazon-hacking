import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_SSL: z.string().transform((val) => val === "true").default("false"),

  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
  BACKEND_URL: z.string().url().min(1),
  FRONTEND_URL: z.string().url().min(1),
  PORT: z.coerce.number().int().positive().default(8080),

  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  REDIS_TLS: z.string().transform((val) => val === "true").default("false"),

  // AWS
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // S3 / R2
  S3_PUBLIC_BUCKET_URL: z.string().default("https://my-storage.s3.amazonaws.com"),
  S3_PUBLIC_BUCKET_NAME: z.string().default("my-storage"),
  S3_PUBLIC_URL: z.string().url().default("https://your-cloudfront-url.cloudfront.net"),
  S3_ENDPOINT: z.string().url().optional(),

  // Email
  DEFAULT_FROM_EMAIL: z.string().email(),

  // OpenTelemetry
  OTEL_ENABLED: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default("my-api"),
  OTEL_SERVICE_VERSION: z.string().default("1.0.0"),
  OTEL_ENVIRONMENT: z.string().optional(),
  OTEL_EXPORTER_OTLP_PROTOCOL: z.enum(["http/protobuf", "http/json", "grpc"]).default("http/protobuf"),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),
  OTEL_LOG_LEVEL: z.enum(["none", "error", "warn", "info", "debug", "verbose", "all"]).default("none"),
  OTEL_METRICS_EXPORT_INTERVAL_MS: z.coerce.number().int().positive().default(60000),

  // Logging
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  LOG_PRETTY: z.string().transform(v => v === "true").default("false"),

  // Metrics
  METRICS_ENABLED: z.string().transform(v => v === "true").default("true"),
  METRICS_PREFIX: z.string().default("my_api"),

  // X-API-Token
  X_API_TOKEN: z.string().min(1).default("development-token"),

  // Messaging (WhatsApp via Evolution API or Arara)
  MESSAGE_SENDER: z.enum(["evolution", "arara", "mock"]).default("arara"),
  EVOLUTION_URL: z.string().url().optional(),
  EVOLUTION_API_KEY: z.string().optional(),
  EVOLUTION_INSTANCE: z.string().optional(),
  EVOLUTION_ALERT_GROUP_ID: z.string().optional(),
  EVOLUTION_ALERTS_ENABLED: z.string().transform((val) => val === "true").default("false"),
  ARARA_URL: z.string().url().default("https://api.ararahq.com/api/v1"),
  ARARA_API_KEY: z.string().optional(),
  VOTE_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  VOTE_TOKEN_RATE_LIMIT_COUNT: z.coerce.number().int().positive().default(3),
  VOTE_TOKEN_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(600),
  VOTE_TOKEN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  VOTE_TOKEN_IP_RATE_LIMIT_COUNT: z.coerce.number().int().positive().default(5),
  VOTE_TOKEN_IP_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(600),
  MAX_VOTES_PER_NORMALIZED_EMAIL: z.coerce.number().int().positive().default(5),
  RESEND_API_KEY: z.string().min(1),

  // Proxy API
  PROXY_API_KEY: z.string().min(1),

  // Cloudflare Turnstile
  TURNSTILE_SECRET_KEY: z.string().min(1),

  // Cloudflare Analytics (GraphQL Analytics API — zone unique visitors)
  CLOUDFLARE_API_TOKEN: z.string().optional(),
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_ANALYTICS_DAYS: z.coerce.number().int().positive().max(366).default(7),

  // Umami Analytics (self-hosted) — admin dashboard data source.
  // All optional: when unset, the Umami endpoints return a "not configured" error
  // and the dashboard renders an empty state (same pattern as Cloudflare above).
  UMAMI_API_URL: z.string().url().optional(),
  UMAMI_USERNAME: z.string().optional(),
  UMAMI_PASSWORD: z.string().optional(),
  UMAMI_WEBSITE_ID: z.string().optional(),
  UMAMI_TIMEZONE: z.string().default("America/Belem"),
  UMAMI_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(43200),
  UMAMI_OVERVIEW_CACHE_SECONDS: z.coerce.number().int().positive().default(300),
  UMAMI_VOTE_GOAL: z.coerce.number().int().positive().default(500),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,

  get OTEL_ENABLED_COMPUTED(): boolean {
    if (parsedEnv.OTEL_ENABLED === "true") return true;
    if (parsedEnv.OTEL_ENABLED === "false") return false;
    return parsedEnv.NODE_ENV === "production";
  },

  get OTEL_ENVIRONMENT_COMPUTED(): string {
    return parsedEnv.OTEL_ENVIRONMENT || parsedEnv.NODE_ENV;
  },
};
