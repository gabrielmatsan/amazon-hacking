import { ValidationError } from "elysia";
import { logger } from "../observability";
import { BadRequestError } from "./bad-error-request";
import { ConflictError } from "./conflict-error";
import { ForbiddenError } from "./forbidden-error";
import { NotFoundError } from "./not-found-error";
import { UnauthorizedError } from "./unauthorized-error";

interface ErrorResponse {
  message: string;
  code: number;
}

export function globalErrorHandler(error: any): ErrorResponse {
  if (error instanceof ValidationError) {
    const firstError = error.all[0];
    const errorDetails = firstError as any;

    let fieldName = "unknown";
    if (errorDetails?.path) {
      const path = errorDetails.path;
      fieldName = path.startsWith("/") ? path.slice(1).replaceAll("/", ".") : path || "root";
    }

    let message =
      errorDetails?.customError ||
      errorDetails?.schema?.error ||
      errorDetails?.message ||
      "Validation failed";

    if (fieldName !== "unknown" && !message.toLowerCase().includes(fieldName.toLowerCase())) {
      message = `${message} (field: ${fieldName})`;
    }

    logger.warn({ code: 422, field: fieldName, message }, "Validation error");

    return { message, code: 422 };
  }

  if (error instanceof BadRequestError) {
    logger.warn({ error: error.message }, "Bad request error");
    return { message: error.message, code: 400 };
  }

  if (error instanceof UnauthorizedError) {
    logger.warn({ error: error.message }, "Unauthorized error");
    return { message: error.message, code: 401 };
  }

  if (error instanceof ForbiddenError) {
    logger.warn({ error: error.message }, "Forbidden error");
    return { message: error.message, code: 403 };
  }

  if (error instanceof NotFoundError) {
    logger.warn({ error: error.message }, "Not found error");
    return { message: error.message, code: 404 };
  }

  if (error instanceof ConflictError) {
    logger.warn({ error: error.message }, "Conflict error");
    return { message: error.message, code: 409 };
  }

  if (error instanceof Error) {
    logger.error({ error: error.message }, "Error");
    return { message: error.message, code: 500 };
  }

  logger.error({ error: JSON.stringify(error) }, "Unknown error");
  return { message: "Internal server error", code: 500 };
}
