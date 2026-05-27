import pino, { type Logger, type LoggerOptions } from "pino";
import { getTraceContext, emitOtelLog } from "../telemetry";
import { env } from "../../env/env";

const LOG_LEVEL = env.LOG_LEVEL;
const OTEL_SERVICE_NAME = env.OTEL_SERVICE_NAME;
const OTEL_ENVIRONMENT = env.OTEL_ENVIRONMENT;

const formatters: LoggerOptions["formatters"] = {
  level: (label) => ({ level: label }),
  bindings: () => ({}),
  log: (obj) => {
    const traceContext = getTraceContext();
    return {
      ...obj,
      ...traceContext,
    };
  },
};

const levelNames: Record<number, string> = {
  10: "trace",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "fatal",
};

const baseConfig: LoggerOptions = {
  level: LOG_LEVEL,
  formatters,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: OTEL_SERVICE_NAME,
    environment: OTEL_ENVIRONMENT,
  },
  redact: {
    paths: [
      "password",
      "secret",
      "token",
      "authorization",
      "cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
    ],
    censor: "[REDACTED]",
  },
  hooks: {
    logMethod(inputArgs, method, level) {
      const [firstArg, ...rest] = inputArgs;
      let message: string;
      let attributes: Record<string, unknown> = {};

      if (typeof firstArg === "string") {
        message = firstArg;
      } else if (typeof firstArg === "object" && firstArg !== null) {
        attributes = firstArg as Record<string, unknown>;
        message = typeof rest[0] === "string" ? rest[0] : "";
      } else {
        message = String(firstArg);
      }

      const levelName = levelNames[level] || "info";
      emitOtelLog(levelName, message, attributes);

      return method.apply(this, inputArgs);
    },
  },
};

function createLogger(): Logger {
  return pino(baseConfig);
}

export const logger = createLogger();

export function createChildLogger(bindings: Record<string, unknown>): Logger {
  return logger.child(bindings);
}

export type AppLogger = Logger;

export const loggers = {
  db: createChildLogger({ component: "database" }),
  redis: createChildLogger({ component: "redis" }),
  http: createChildLogger({ component: "http" }),
  auth: createChildLogger({ component: "auth" }),
  api: createChildLogger({ component: "api" }),
};
