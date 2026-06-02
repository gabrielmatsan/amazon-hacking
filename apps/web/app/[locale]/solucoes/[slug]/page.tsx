import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { TeamDetail } from "@/components/solutions/team-detail";
import { setRequestLocale } from "@/lib/i18n";
import { localeUrl, languageAlternates, OG_LOCALE, resolveLocale, solutionsCopy } from "@/lib/seo";

export const dynamicParams = true;

type SolutionMeta = { name: string; description?: string | null };

async function fetchSolution(slug: string): Promise<SolutionMeta | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/v1";
  try {
    const res = await fetch(`${apiUrl}/teams/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: SolutionMeta };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const team = await fetchSolution(slug);

  const name = team?.name ?? solutionsCopy[locale].title;
  const title = `${name} — Amazon Hacking 2026`;
  const description =
    team?.description?.trim().slice(0, 160) || solutionsCopy[locale].description;
  const path = `/solucoes/${slug}`;
  const url = localeUrl(locale, path);

  return {
    title,
    description,
    alternates: { canonical: url, languages: languageAlternates(path) },
    openGraph: {
      type: "article",
      siteName: "Amazon Hacking",
      url,
      locale: OG_LOCALE[locale],
      title,
      description,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const resolved = setRequestLocale(locale);

  return (
    <>
      <Header locale={resolved} variant="inner" />
      <main className="min-h-dvh bg-white pt-24 pb-16 md:pt-32">
        <TeamDetail slug={slug} locale={resolved} />
      </main>
      <Footer />
    </>
  );
}
