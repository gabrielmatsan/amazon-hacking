import type { MetadataRoute } from "next";

// Web app manifest (served at /manifest.webmanifest). The link tag is injected
// automatically by this file convention. Background/theme colors drive the PWA
// splash screen and browser chrome; icons live in public/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Amazon Hacking",
    short_name: "Amazon Hacking",
    description:
      "Programa de formação do CESUPA que conecta universitários, comunidades amazônicas e empresas em prol do desenvolvimento bioeconômico da região.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0165b7",
    theme_color: "#0165b7",
    categories: ["education"],
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
