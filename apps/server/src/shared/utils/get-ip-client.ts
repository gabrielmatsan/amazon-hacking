export function getIpClient(request: Request, server?: any): string {

  // 1. Real client IP forwarded by Next.js proxy (not overwritten by Cloudflare)
  const realClientIp = request.headers.get("x-real-client-ip");
  if (realClientIp) {
    return realClientIp;
  }

  // 2. Cloudflare CF-Connecting-IP (direct requests, not proxied)
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }


  // 2. X-Forwarded-For (fallback)
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ip = xForwardedFor.split(",")[0];
    if (ip) {
      return ip;
    }
  }


  // 3. X-Real-IP (fallback)
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  // 4. Direct connection IP (last resort)
  if (server?.requestIP) {
    const directIp = server.requestIP(request)?.address;
    if (directIp) {
      return directIp;
    }
  }

  return "unknown";
}