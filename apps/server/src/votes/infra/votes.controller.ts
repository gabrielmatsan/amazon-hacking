import { createController, errorResponse } from "@/shared/infra/base.controller";
import { env } from "@/shared/infra/env/env";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { RateLimitContext } from "@/shared/infra/rate-limiting/rate-limit";
import { getIpClient } from "@/shared/utils/get-ip-client";
import { getIpLocation } from "@/shared/utils/get-ip-location";
import { t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import { voteForTimeByIdInput, voteForTimeByIdUseCase } from "../application/vote-for-time-by-id.usecase";

export const votesController = createController({ prefix: "/votes", normalize: false })
  .use(rateLimit({
    context: new RateLimitContext(),
    duration: 1000 * 60 * 1, // 1 minuto
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
      return request.url.includes("/health") || request.url.includes("/metrics") || request.url.includes("/docs");
    },
    errorResponse: new Response(JSON.stringify({
      error: "failed",
      message: "Rate limit exceeded",
    }),
      {
        status: 429,
        headers: { "content-type": "application/json" }
      })
  }))
  .post("/", async ({ body, validateToken, request, set }) => {
    // 1. Valida o token do usuário
    const user = await validateToken(request);
    if (!user) throw new UnauthorizedError("Unauthorized");

    // 2. Pega o User Agent e o IP do usuário
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const ipAddress = getIpClient(request);
    const ipLocation = await getIpLocation(ipAddress);

    await voteForTimeByIdUseCase({
      userId: user.id,
      teamId: body.teamId,
      ipAddress: ipAddress,
      ipCountry: ipLocation?.country ?? undefined,
      userAgent,
      metadata: {
        headers: request.headers,
        ipLocation,
      },
    })

    set.status = 201;

    return {
      message: "Vote created successfully",
    };

  }, {
    requireApiToken: true, // apenas permite que quem tenha o token da API possa votar, (Server Actions)
    body: t.Pick(voteForTimeByIdInput, ["teamId"]),
    response: {
      200: t.Object({ message: t.String() }),
      401: errorResponse,
      404: errorResponse,
      409: errorResponse,
      422: errorResponse,
    },
    detail: { tags: ["Votes"], summary: "Vote for a team" },
  })
