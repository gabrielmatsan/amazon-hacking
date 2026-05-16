import { createController, errorResponse } from "@/shared/infra/base.controller";
import { UnauthorizedError } from "@/shared/infra/errors/unauthorized-error";
import { getIpClient } from "@/shared/utils/get-ip-client";
import { getIpLocation } from "@/shared/utils/get-ip-location";
import { t } from "elysia";
import { voteForTimeByIdInput, voteForTimeByIdUseCase } from "../application/vote-for-time-by-id.usecase";

export const votesController = createController({ prefix: "/votes", normalize: false })
  .post("/", async ({ body, validateToken, request, set }) => {

    const user = await validateToken(request);
    if (!user) throw new UnauthorizedError("Unauthorized");

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

    return {
      message: "Vote created successfully",
    };

  }, {
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
