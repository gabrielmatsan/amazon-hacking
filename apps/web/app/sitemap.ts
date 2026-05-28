import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { languageAlternates } from "@/lib/seo";

const routes = ["/", "/privacy-policy"];

function localized(path: string): MetadataRoute.Sitemap[number] {
  return {
    url: path === "/" ? SITE_URL : `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "weekly" : "yearly",
    priority: path === "/" ? 1 : 0.3,
    alternates: { languages: languageAlternates(path) },
  };
}
//
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(localized);
}
