import type { Metadata } from "next";
import { m } from "@/lib/paraglide/messages";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { WaveDivider } from "@/components/site/wave-divider";
import { SolutionsGallery } from "@/components/solutions/solutions-gallery";
import { TucupyCta } from "@/components/site/tucupy-cta";
import { winners } from "@/lib/content/winners";
import { setRequestLocale } from "@/lib/i18n";
import { pageMetadata, resolveLocale, solutionsCopy } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const copy = solutionsCopy[locale];
  return pageMetadata({
    locale,
    path: "/solucoes",
    title: copy.title,
    description: copy.description,
    robots: { index: false, follow: true },
  });
}

export default async function SolutionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = setRequestLocale(locale);

  return (
    <>
      <Header locale={resolved} variant="inner" />
      <main>
        {/* Intro */}
        <section className="bg-white pt-32 pb-12 text-center md:pt-40">
          <div className="mx-auto max-w-3xl px-6">
            <h1 className="text-3xl leading-tight font-bold text-black sm:text-4xl md:text-5xl lg:text-6xl">
              {m.solutions_page_title({}, { locale: resolved })}
            </h1>
            <p className="mx-auto mt-6 max-w-[60ch] text-base leading-relaxed text-neutrals-600 md:text-lg">
              {m.solutions_page_description({}, { locale: resolved })}
            </p>
          </div>
          <div
            aria-hidden
            className="mx-auto mt-14 h-28 max-w-5xl bg-symbol bg-contain bg-repeat opacity-20 md:h-36"
          />
        </section>

        {/* Gallery */}
        <WaveDivider from="#ffffff" to="#005194" />
        <section className="bg-primary-200 px-6 py-16 md:py-20">
          <div className="mx-auto max-w-screen-2xl">
            <h2 className="mx-auto mb-10 max-w-[45ch] text-center text-base text-white/90 md:text-lg">
              {m.solutions_gallery_title({}, { locale: resolved })}
            </h2>
            <SolutionsGallery solutions={winners} locale={resolved} />
          </div>
        </section>
        <WaveDivider from="#005194" to="#ffffff" />

        {/* Tucupy CTA */}
        <TucupyCta locale={resolved} />
      </main>
      <Footer />
    </>
  );
}
