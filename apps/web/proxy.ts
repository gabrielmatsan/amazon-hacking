import { NextResponse, type NextRequest } from "next/server";
import { paraglideMiddleware } from "@/lib/paraglide/server";

// Maps the public, prefix-less URLs (/, /en, /es) onto the statically generated
// app/[locale] routes (/pt-br, /en, /es). Paraglide resolves the locale (URL →
// cookie → base) and de-localizes the path; we rewrite to the [locale] segment.
export function proxy(request: NextRequest): Promise<Response> {
  return paraglideMiddleware(request, ({ request: localizedRequest, locale }) => {
    const deLocalizedPath = new URL(localizedRequest.url).pathname;
    const targetPath = `/${locale}${deLocalizedPath === "/" ? "" : deLocalizedPath}`;

    const rewriteUrl = new URL(request.url);
    rewriteUrl.pathname = targetPath;

    const requestHeaders = new Headers(localizedRequest.headers);
    requestHeaders.set("x-paraglide-locale", locale);

    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|_vercel|favicon.ico|icon\\.|apple-icon\\.|sitemap\\.xml|robots\\.txt|opengraph-image|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico)).*)",
  ],
};
