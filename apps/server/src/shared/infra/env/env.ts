import z from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),

  NODE_ENV: z.enum(["development", "production", "test"]),
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

  // S3
  S3_PUBLIC_BUCKET_URL: z.string().default("https://my-storage.s3.amazonaws.com"),
  S3_PUBLIC_BUCKET_NAME: z.string().default("my-storage"),
  S3_PUBLIC_URL: z.string().url().default("https://your-cloudfront-url.cloudfront.net"),

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
  X_API_TOKEN: z.string().min(1).default("B#^$Pj&%u8*qK5VGHmgofk77wn4&@A"),
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
