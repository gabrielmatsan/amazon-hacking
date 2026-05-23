import type { Metadata } from "next";
import { locales, baseLocale, isLocale, type Locale } from "@/lib/paraglide/runtime";
import { SITE_URL } from "@/lib/site";

// hreflang code per locale (used by metadata alternates AND sitemap).
export const HREFLANG: Record<Locale, string> = {
  "pt-br": "pt-BR",
  en: "en-US",
  es: "es-ES",
};

// OpenGraph locale code per locale (underscored, region-qualified).
export const OG_LOCALE: Record<Locale, string> = {
  "pt-br": "pt_BR",
  en: "en_US",
  es: "es_ES",
};

// <html lang> value per locale.
export const HTML_LANG: Record<Locale, string> = {
  "pt-br": "pt-BR",
  en: "en",
  es: "es",
};

// Coerce an unknown route param into a valid Locale (base locale as fallback).
export function resolveLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : baseLocale;
}

// Absolute URL for a path in a given locale. pt-br is the base locale and lives
// at the root (no prefix); en/es are prefixed. Mirrors next.config rewrites.
export function localeUrl(locale: Locale, path = ""): string {
  const prefix = locale === "pt-br" ? "" : `/${locale}`;
  const suffix = path === "/" ? "" : path;
  return `${SITE_URL}${prefix}${suffix}`;
}

// hreflang map for a path, including x-default (points at the base locale).
export function languageAlternates(path = ""): Record<string, string> {
  return {
    [HREFLANG["pt-br"]]: localeUrl("pt-br", path),
    [HREFLANG.en]: localeUrl("en", path),
    [HREFLANG.es]: localeUrl("es", path),
    "x-default": localeUrl("pt-br", path),
  };
}

function alternateOgLocales(locale: Locale): string[] {
  return locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]);
}

// The OG image lives at the root (app/opengraph-image.tsx) and is served at
// /opengraph-image — no locale prefix, so it survives the /pt-br redirect.
// Referenced explicitly here because a localized openGraph config would
// otherwise override the file-based image inherited from the root segment.
const OG_IMAGE_URL = "/opengraph-image";

function ogImages(alt: string): { url: string; width: number; height: number; alt: string }[] {
  return [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt }];
}

type SiteCopy = {
  tagline: string;
  description: string;
  shortDescription: string;
  keywords: string[];
};

const SHARED_KEYWORDS = [
  "Amazon Hacking",
  "CESUPA",
  "Vila Jutaí",
  "Moju",
  "Pará",
  "COP 30",
  "Computação Amostra",
];

export const siteCopy: Record<Locale, SiteCopy> = {
  "pt-br": {
    tagline: "Onde a Amazônia encontra a inovação",
    description:
      "Programa de formação do CESUPA que conecta universitários, comunidades amazônicas e empresas em prol do desenvolvimento bioeconômico da região.",
    shortDescription: "Programa de formação do CESUPA na Amazônia.",
    keywords: [...SHARED_KEYWORDS, "Amazônia", "Bioeconomia", "Inovação", "Hackathon", "Sustentabilidade"],
  },
  en: {
    tagline: "Where the Amazon meets innovation",
    description:
      "CESUPA's education program connecting university students, Amazonian communities and companies to drive the region's bioeconomic development.",
    shortDescription: "A CESUPA education program in the Amazon.",
    keywords: [...SHARED_KEYWORDS, "Amazon", "Bioeconomy", "Innovation", "Hackathon", "Sustainability"],
  },
  es: {
    tagline: "Donde la Amazonía encuentra la innovación",
    description:
      "Programa de formación del CESUPA que conecta universitarios, comunidades amazónicas y empresas para impulsar el desarrollo bioeconómico de la región.",
    shortDescription: "Programa de formación del CESUPA en la Amazonía.",
    keywords: [...SHARED_KEYWORDS, "Amazonía", "Bioeconomía", "Innovación", "Hackathon", "Sostenibilidad"],
  },
};

type PageCopy = { title: string; description: string };

export const solutionsCopy: Record<Locale, PageCopy> = {
  "pt-br": {
    title: "Soluções",
    description:
      "Galeria de soluções construídas no Amazon Hacking — projetos de impacto para as comunidades amazônicas.",
  },
  en: {
    title: "Solutions",
    description:
      "Gallery of solutions built at Amazon Hacking — high-impact projects for Amazonian communities.",
  },
  es: {
    title: "Soluciones",
    description:
      "Galería de soluciones construidas en Amazon Hacking — proyectos de impacto para las comunidades amazónicas.",
  },
};

export const privacyCopy: Record<Locale, PageCopy> = {
  "pt-br": {
    title: "Política de Privacidade",
    description: "Como o Amazon Hacking trata cookies e dados de navegação.",
  },
  en: {
    title: "Privacy Policy",
    description: "How Amazon Hacking handles cookies and browsing data.",
  },
  es: {
    title: "Política de Privacidad",
    description: "Cómo Amazon Hacking trata las cookies y los datos de navegación.",
  },
};

// Root (home/layout) metadata, fully localized by locale.
export function rootMetadata(locale: Locale): Metadata {
  const copy = siteCopy[locale];
  const url = localeUrl(locale);
  const title = `Amazon Hacking — ${copy.tagline}`;

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: "Amazon Hacking",
    title: { default: title, template: "%s · Amazon Hacking" },
    description: copy.description,
    category: "Education",
    keywords: copy.keywords,
    authors: [{ name: "CESUPA", url: "https://www.cesupa.br" }],
    creator: "CESUPA",
    publisher: "CESUPA",
    alternates: {
      canonical: url,
      languages: languageAlternates(),
    },
    openGraph: {
      type: "website",
      siteName: "Amazon Hacking",
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: alternateOgLocales(locale),
      title,
      description: copy.description,
      images: ogImages(title),
    },
    twitter: {
      card: "summary_large_image",
      site: "@cesupaonline",
      creator: "@cesupaonline",
      title,
      description: copy.shortDescription,
      images: [OG_IMAGE_URL],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

// Per-page localized metadata (title is templated by the root layout). Pass
// `robots` to override indexing (e.g. noindex for the solutions stub).
export function pageMetadata({
  locale,
  path,
  title,
  description,
  robots,
}: {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  robots?: Metadata["robots"];
}): Metadata {
  const url = localeUrl(locale, path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(path),
    },
    openGraph: {
      type: "website",
      siteName: "Amazon Hacking",
      url,
      locale: OG_LOCALE[locale],
      alternateLocale: alternateOgLocales(locale),
      title,
      description,
      images: ogImages(title),
    },
    twitter: {
      card: "summary_large_image",
      site: "@cesupaonline",
      creator: "@cesupaonline",
      title,
      description,
      images: [OG_IMAGE_URL],
    },
    ...(robots ? { robots } : {}),
  };
}
