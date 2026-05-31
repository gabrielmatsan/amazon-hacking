export function getIpClient(request: Request, server?: any): string {
  // A ordem abaixo vai do mais confiável (setado pela borda) ao menos confiável.
  // Garanta que o proxy de borda STRIPA `x-real-client-ip`, `x-forwarded-for` e `x-real-ip`
  // vindos do cliente; caso contrário o IP continua spoofável.
  // vai do mais confiável (setado pela borda) ao menos confiável. Garanta que o
  // proxy de borda STRIPA `x-real-client-ip`, `x-forwarded-for` e `x-real-ip`
  // vindos do cliente; caso contrário o IP continua spoofável.


  // 1. Real client IP encaminhado pelo proxy Next.js (confiável apenas se o
  //    proxy stripar o header recebido do cliente antes de re-setá-lo).
  const realClientIp = request.headers.get("x-real-client-ip");
  if (realClientIp) {
    return realClientIp;
  }

  // 2. Cloudflare CF-Connecting-IP: setado pela borda da Cloudflare e sobrescreve
  //    qualquer valor enviado pelo cliente — mais confiável quando atrás da CF.
  const cfConnectingIp = request.headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }


  // 3. X-Forwarded-For (fallback)
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ip = xForwardedFor.split(",")[0];
    if (ip) {
      return ip;
    }
  }

  // 4. X-Real-IP (fallback)
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  // 5. Direct connection IP (last resort)
  if (server?.requestIP) {
    const directIp = server.requestIP(request)?.address;
    if (directIp) {
      return directIp;
    }
  }

  return "unknown";
}