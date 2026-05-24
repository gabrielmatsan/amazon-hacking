import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "pub-fa05dfe540d6495ab86c69ad7eea34db.r2.dev" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  // Base locale (pt-br) is served at the root. We can't use middleware/proxy on
  // Cloudflare (Next 16 forces proxy onto the Node runtime, which OpenNext's
  // worker doesn't support), so the root paths are mapped to the prerendered
  // /pt-br routes via rewrites, and /pt-br/* is redirected to keep URLs canonical.
  async rewrites() {
    return [
      { source: "/", destination: "/pt-br" },
      { source: "/solucoes", destination: "/pt-br/solucoes" },
      { source: "/solucoes/:slug", destination: "/pt-br/solucoes/:slug" },
      { source: "/privacy-policy", destination: "/pt-br/privacy-policy" },
    ];
  },
  async redirects() {
    return [
      { source: "/pt-br", destination: "/", permanent: true },
      { source: "/pt-br/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

initOpenNextCloudflareForDev();

export default nextConfig;
