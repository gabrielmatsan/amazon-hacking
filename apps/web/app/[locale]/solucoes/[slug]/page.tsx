import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { TeamDetail } from "@/components/solutions/team-detail";
import { setRequestLocale } from "@/lib/i18n";

export const dynamicParams = true;

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
