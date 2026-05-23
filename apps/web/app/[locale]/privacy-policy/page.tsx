import type { Metadata } from "next";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { Container } from "@/components/site/container";
import { setRequestLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  robots: { index: true, follow: false },
};

const lastUpdated = "2026-01-15";

const content = {
  "pt-br": {
    title: "Política de Privacidade",
    updated: "Última atualização",
    sections: [
      {
        heading: "Coleta de dados",
        body: "Este site coleta apenas dados estritamente necessários para sua experiência: a preferência de idioma é guardada em cookie próprio (PARAGLIDE_LOCALE). Não armazenamos dados pessoais identificáveis.",
      },
      {
        heading: "Estatísticas anônimas",
        body: "Usamos Umami Analytics, ferramenta cookieless, para entender quais páginas são mais visitadas. Nenhum dado identificável é coletado — não há rastreamento entre sites nem perfis de usuários.",
      },
      {
        heading: "Cookies essenciais",
        body: "PARAGLIDE_LOCALE: guarda o idioma escolhido pelo visitante (até 13 meses). Pode ser apagado a qualquer momento nas configurações do navegador.",
      },
      {
        heading: "Direitos do titular (LGPD)",
        body: "Como não tratamos dados pessoais identificáveis, não há cadastros a serem consultados, retificados ou apagados. Caso queira nos contatar sobre privacidade, escreva para amazon.hacking@cesupa.br.",
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updated: "Last updated",
    sections: [
      {
        heading: "Data collection",
        body: "This site collects only what is strictly necessary for your experience: your language preference is stored in a first-party cookie (PARAGLIDE_LOCALE). We don't store personally identifiable data.",
      },
      {
        heading: "Anonymous analytics",
        body: "We use Umami Analytics, a cookieless tool, to understand which pages are most visited. No identifiable data is collected — no cross-site tracking, no user profiling.",
      },
      {
        heading: "Essential cookies",
        body: "PARAGLIDE_LOCALE: stores the visitor's chosen language (up to 13 months). Can be cleared anytime in browser settings.",
      },
      {
        heading: "Data subject rights (LGPD)",
        body: "Since we don't process personal identifiable data, there are no records to be retrieved, corrected or deleted. To contact us about privacy, email amazon.hacking@cesupa.br.",
      },
    ],
  },
  es: {
    title: "Política de Privacidad",
    updated: "Última actualización",
    sections: [
      {
        heading: "Recolección de datos",
        body: "Este sitio recolecta solo lo estrictamente necesario: la preferencia de idioma se guarda en cookie propia (PARAGLIDE_LOCALE). No almacenamos datos personales identificables.",
      },
      {
        heading: "Estadísticas anónimas",
        body: "Usamos Umami Analytics, herramienta sin cookies, para entender qué páginas se visitan más. Ningún dato identificable es recolectado.",
      },
      {
        heading: "Cookies esenciales",
        body: "PARAGLIDE_LOCALE: guarda el idioma elegido por el visitante (hasta 13 meses). Puede borrarse en cualquier momento desde el navegador.",
      },
      {
        heading: "Derechos del titular",
        body: "Como no procesamos datos personales identificables, no hay registros a consultar, rectificar o eliminar. Para contactarnos sobre privacidad, escriba a amazon.hacking@cesupa.br.",
      },
    ],
  },
} as const;

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolved = setRequestLocale(locale);
  const c = content[resolved];

  return (
    <>
      <Header locale={resolved} />
      <main className="bg-primary-400 pt-40 pb-0 text-white">
        <Container size="tight" className="pb-24">
          <p className="text-xs tracking-[0.18em] uppercase text-white/70">
            {c.updated}: {lastUpdated}
          </p>
          <h1 className="mt-6 text-5xl leading-[1.05] font-bold md:text-6xl">
            {c.title}
          </h1>
        </Container>
      </main>

      <section className="bg-white py-20 md:py-28">
        <Container size="tight" className="space-y-12">
          {c.sections.map((section) => (
            <article key={section.heading}>
              <h2 className="text-2xl font-bold text-primary-100 md:text-3xl">
                {section.heading}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-neutrals-600 md:text-lg">
                {section.body}
              </p>
            </article>
          ))}
        </Container>
      </section>

      <Footer />
    </>
  );
}
