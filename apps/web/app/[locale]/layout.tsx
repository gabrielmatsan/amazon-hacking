import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/lib/paraglide/runtime";
import { setRequestLocale } from "@/lib/i18n";
import { QueryProvider } from "@/providers/query-provider";
import { resolveLocale, rootMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return rootMetadata(resolveLocale(locale));
}

export const viewport: Viewport = {
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
  setRequestLocale(locale);

  return <QueryProvider>{children}</QueryProvider>;
}
