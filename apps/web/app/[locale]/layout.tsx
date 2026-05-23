import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/lib/paraglide/runtime";
import { setRequestLocale } from "@/lib/i18n";
import { UmamiScript } from "@/components/site/umami-script";
import { cn } from "@/lib/utils";
import { HTML_LANG, resolveLocale, rootMetadata } from "@/lib/seo";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return rootMetadata(resolveLocale(locale));
}

export const viewport: Viewport = {
  // Single, unconditional brand blue: the site is light-only, and a media-only
  // theme-color is ignored by some browsers (notably iOS Safari), which then
  // fall back to white. Keep it in sync with the html background in globals.css.
  themeColor: "#0165b7",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
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
  const resolved = setRequestLocale(locale);

  return (
    <html lang={HTML_LANG[resolved]} className={cn(gilroy.variable)}>
      <head>
        <UmamiScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
