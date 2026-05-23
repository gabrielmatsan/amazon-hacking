import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/lib/paraglide/runtime";
import { setRequestLocale } from "@/lib/i18n";
import { UmamiScript } from "@/components/site/umami-script";
import { cn } from "@/lib/utils";
import "../globals.css";

const gilroy = localFont({
  src: [
    { path: "../fonts/Gilroy-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/Gilroy-Medium.ttf", weight: "500", style: "normal" },
    { path: "../fonts/Gilroy-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-gilroy",
  display: "swap",
});

const SITE_URL = "https://amazonhacking.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Amazon Hacking",
    template: "%s · Amazon Hacking",
  },
  description:
    "Programa de formação do CESUPA que conecta universitários, comunidades amazônicas e empresas em prol do desenvolvimento bioeconômico da região.",
  applicationName: "Amazon Hacking",
  manifest: "/site.webmanifest",
  category: "Education",
  keywords: [
    "Amazon Hacking",
    "CESUPA",
    "Amazônia",
    "Bioeconomia",
    "Inovação",
    "COP 30",
    "Computação Amostra",
    "Vila Jutaí",
    "Moju",
  ],
  authors: [{ name: "CESUPA" }],
  creator: "CESUPA",
  publisher: "CESUPA",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "pt-BR": SITE_URL,
      "en-US": `${SITE_URL}/en`,
      "es-ES": `${SITE_URL}/es`,
    },
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    alternateLocale: ["en_US", "es_ES"],
    url: SITE_URL,
    siteName: "Amazon Hacking",
    title: "Amazon Hacking",
    description:
      "Programa de formação do CESUPA que conecta universitários, comunidades amazônicas e empresas em prol do desenvolvimento bioeconômico da região.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@cesupaonline",
    creator: "@cesupaonline",
    title: "Amazon Hacking",
    description: "Programa de formação do CESUPA.",
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

export const viewport: Viewport = {
  themeColor: "#0165B7",
  width: "device-width",
  initialScale: 1,
};

const htmlLangByLocale: Record<string, string> = {
  "pt-br": "pt-BR",
  en: "en",
  es: "es",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const dynamicParams = false;

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={htmlLangByLocale[locale] ?? "pt-BR"} className={cn(gilroy.variable)}>
      <head>
        <UmamiScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
