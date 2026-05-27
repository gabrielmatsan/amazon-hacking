import { Container, getContainer } from "@cloudflare/containers";

interface Env {
  SERVER_CONTAINER: DurableObjectNamespace<ServerContainer>;

  DATABASE_URL: string;
  REDIS_URL: string;
  REDIS_TLS: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URI: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_REGION: string;
  S3_PUBLIC_BUCKET_NAME: string;
  S3_PUBLIC_BUCKET_URL: string;
  S3_PUBLIC_URL: string;
  S3_ENDPOINT: string;
  DEFAULT_FROM_EMAIL: string;
  RESEND_API_KEY: string;
  PROXY_API_KEY: string;
  X_API_TOKEN: string;
  BACKEND_URL: string;
  FRONTEND_URL: string;
  EVOLUTION_URL: string;
  EVOLUTION_API_KEY: string;
  EVOLUTION_INSTANCE: string;
  EVOLUTION_ALERT_GROUP_ID: string;
  EVOLUTION_ALERTS_ENABLED: string;
  MESSAGE_SENDER: string;
  OTEL_ENABLED: string;
  OTEL_SERVICE_NAME: string;
  OTEL_SERVICE_VERSION: string;
  OTEL_EXPORTER_OTLP_ENDPOINT: string;
  OTEL_EXPORTER_OTLP_HEADERS: string;
  LOG_LEVEL: string;
  LOG_PRETTY: string;
  METRICS_ENABLED: string;
  METRICS_PREFIX: string;
}

export class ServerContainer extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = "4h";
  enableInternet = true;

  override get envVars(): Record<string, string> {
    const e = this.env;
    return {
      NODE_ENV: "production",
      PORT: "8080",
      DATABASE_URL: e.DATABASE_URL,
      REDIS_URL: e.REDIS_URL,
      REDIS_TLS: e.REDIS_TLS ?? "false",
      GOOGLE_CLIENT_ID: e.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: e.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: e.GOOGLE_REDIRECT_URI,
      AWS_ACCESS_KEY_ID: e.AWS_ACCESS_KEY_ID ?? "",
      AWS_SECRET_ACCESS_KEY: e.AWS_SECRET_ACCESS_KEY ?? "",
      AWS_REGION: e.AWS_REGION ?? "us-east-1",
      S3_PUBLIC_BUCKET_NAME: e.S3_PUBLIC_BUCKET_NAME ?? "",
      S3_PUBLIC_BUCKET_URL: e.S3_PUBLIC_BUCKET_URL ?? "",
      S3_PUBLIC_URL: e.S3_PUBLIC_URL ?? "",
      S3_ENDPOINT: e.S3_ENDPOINT ?? "",
      DEFAULT_FROM_EMAIL: e.DEFAULT_FROM_EMAIL,
      RESEND_API_KEY: e.RESEND_API_KEY,
      PROXY_API_KEY: e.PROXY_API_KEY,
      X_API_TOKEN: e.X_API_TOKEN ?? "",
      BACKEND_URL: e.BACKEND_URL,
      FRONTEND_URL: e.FRONTEND_URL,
      EVOLUTION_URL: e.EVOLUTION_URL ?? "",
      EVOLUTION_API_KEY: e.EVOLUTION_API_KEY ?? "",
      EVOLUTION_INSTANCE: e.EVOLUTION_INSTANCE ?? "",
      EVOLUTION_ALERT_GROUP_ID: e.EVOLUTION_ALERT_GROUP_ID ?? "",
      EVOLUTION_ALERTS_ENABLED: e.EVOLUTION_ALERTS_ENABLED ?? "false",
      MESSAGE_SENDER: e.MESSAGE_SENDER ?? "evolution",
      OTEL_ENABLED: e.OTEL_ENABLED ?? "false",
      OTEL_SERVICE_NAME: e.OTEL_SERVICE_NAME ?? "amazon-hacking-api",
      OTEL_SERVICE_VERSION: e.OTEL_SERVICE_VERSION ?? "1.0.0",
      OTEL_EXPORTER_OTLP_ENDPOINT: e.OTEL_EXPORTER_OTLP_ENDPOINT ?? "",
      OTEL_EXPORTER_OTLP_HEADERS: e.OTEL_EXPORTER_OTLP_HEADERS ?? "",
      LOG_LEVEL: e.LOG_LEVEL ?? "info",
      LOG_PRETTY: e.LOG_PRETTY ?? "false",
      METRICS_ENABLED: e.METRICS_ENABLED ?? "true",
      METRICS_PREFIX: e.METRICS_PREFIX ?? "amazon_hacking_api",
    };
  }

  override onStart(): void {
    console.log("ServerContainer started");
  }

  override onStop(): void {
    console.log("ServerContainer stopped");
  }

  override onError(error: unknown): void {
    console.error("ServerContainer error:", error);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const container = getContainer(env.SERVER_CONTAINER, "main");
    return container.fetch(request);
  },
};
