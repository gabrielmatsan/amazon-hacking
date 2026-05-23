import type { MetadataRoute } from "next";
import { locales } from "@/lib/paraglide/runtime";
import { SITE_URL } from "@/lib/site";

const routes = ["/", "/privacy-policy"];

function localized(path: string): MetadataRoute.Sitemap[number] {
  const url = path === "/" ? SITE_URL : `${SITE_URL}${path}`;
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    const prefix = locale === "pt-br" ? "" : `/${locale}`;
    languages[locale] = `${SITE_URL}${prefix}${path === "/" ? "" : path}`;
  }

  return {
    url,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "yearly",
    priority: path === "/" ? 1 : 0.3,
    alternates: { languages },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(localized);
}
