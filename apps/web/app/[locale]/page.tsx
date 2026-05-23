import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { CookieBanner } from "@/components/site/cookie-banner";
import { WaveDivider } from "@/components/site/wave-divider";
import { OrganizationJsonLd, EventJsonLd } from "@/components/site/json-ld";
import { Hero } from "@/components/home/hero";
import { AboutSection } from "@/components/home/about";
import { MojuSection } from "@/components/home/moju";
import { EixosGrid } from "@/components/home/eixos-grid";
import { EditionsTimeline } from "@/components/home/editions-timeline";
import { WinnersSection } from "@/components/home/winners-section";
import { PrizesSection } from "@/components/home/prizes";
import { PartnersGrid } from "@/components/home/partners-grid";
import { FinalCta } from "@/components/home/final-cta";
import { edition2026 } from "@/lib/content/editions";
import { setRequestLocale } from "@/lib/i18n";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = setRequestLocale(locale);
  return (
    <>
      <OrganizationJsonLd locale={resolved} />
      <EventJsonLd
        year={edition2026.year}
        number={edition2026.number}
        theme={edition2026.theme[resolved]}
        location={edition2026.location}
        locale={resolved}
      />
      <Header locale={resolved} />
      <main>
        <Hero locale={resolved} />
        <WaveDivider from="#00335b" to="#ffffff" />
        <AboutSection />
        <WaveDivider from="#0a0a0a" to="#0165b7" />
        <MojuSection />
        <WaveDivider from="#0165b7" to="#ffffff" />
        <EixosGrid />
        <EditionsTimeline />
        <WaveDivider from="#ffffff" to="#00335b" />
        <WinnersSection />
        <WaveDivider from="#00335b" to="#ffffff" />
        <PrizesSection />
        <PartnersGrid />
        <FinalCta />
      </main>
      <Footer />
      <CookieBanner locale={resolved} />
    </>
  );
}
