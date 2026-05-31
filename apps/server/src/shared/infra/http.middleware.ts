import Elysia from "elysia";

export const httpMiddleware = new Elysia({
  name: "httpMiddleware",
  seed: { value: "service.httpMiddleware" },
})
  .derive({
    as: "global",
  }, () => {
    return {
      getIpClient: async (request: Request, server?: any) => {
        const realClientIp = request.headers.get("x-real-client-ip");
        if (realClientIp) return realClientIp;

        const cfConnectingIp = request.headers.get("cf-connecting-ip");
        if (cfConnectingIp) return cfConnectingIp;

        const xForwardedFor = request.headers.get("x-forwarded-for");
        if (xForwardedFor) return xForwardedFor;

        const xRealIp = request.headers.get("x-real-ip");
        if (xRealIp) return xRealIp;

        if (server?.requestIP) {
          const directIp = server.requestIP(request)?.address;
          if (directIp) return directIp;
        }

        return undefined;
      }
    };
  });
