import { createController, errorResponse } from "@/shared/infra/base.controller";
import { env } from "@/shared/infra/env/env";
import { RateLimitContext } from "@/shared/infra/rate-limiting/rate-limit";
import { t } from "elysia";
import { rateLimit } from "elysia-rate-limit";

import { getIpClient } from "@/shared/utils/get-ip-client";
import {
  createVoteTokenInput,
  createVoteTokenUseCase,
} from "../application/create-vote-token.usecase";

export const votesTokensController = createController({
  prefix: "/votes-token",
  normalize: false,
})
  .use(
    rateLimit({
      context: new RateLimitContext(),
      duration: 1000 * 60,
      max: 10,
      generator: (request: Request) => {
        return (
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for") ??
          request.headers.get("x-real-ip") ??
          "unknown"
        );
      },
      skip: (request: Request) => {
        if (env.NODE_ENV === "development") return true;
        return (
          request.url.includes("/health") ||
          request.url.includes("/metrics") ||
          request.url.includes("/docs")
        );
      },
      errorResponse: new Response(
        JSON.stringify({ error: "failed", message: "Rate limit exceeded" }),
        {
          status: 429,
          headers: { "content-type": "application/json" },
        },
      ),
    }),
  )
  .post(
    "/request",
    async ({ body, validateToken, request, set, server }) => {
      const user = await validateToken(request);
      const ipAddress = getIpClient(request, server);

      const result = await createVoteTokenUseCase(user.id, {
        phoneNumber: body.phoneNumber,
        turnstileToken: body.turnstileToken,
      }, ipAddress);

      set.status = 201;

      return {
        message: result.message,
        expiresAt: result.expiresAt.toISOString(),
        channel: result.channel,
      };
    },
    {
      requireApiToken: true,
      body: createVoteTokenInput,
      response: {
        201: t.Object({
          message: t.String(),
          expiresAt: t.String(),
          channel: t.Union([t.Literal("whatsapp"), t.Literal("email")]),
        }),
        400: errorResponse,
        401: errorResponse,
        403: errorResponse,
        409: errorResponse,
        422: errorResponse,
      },
      detail: {
        tags: ["Votes"],
        summary: "Request a WhatsApp verification code to vote",
      },
    },
  );
