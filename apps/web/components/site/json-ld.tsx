import type { Locale } from "@/lib/paraglide/runtime";
import { HREFLANG } from "@/lib/seo";
import { SITE_URL } from "@/lib/site";

type Json = Record<string, unknown>;

const orgDescription: Record<Locale, string> = {
  "pt-br":
    "Programa de formação do CESUPA conectando ciência, tecnologia e saberes amazônicos.",
  en: "A CESUPA education program connecting science, technology and Amazonian knowledge.",
  es: "Programa de formación del CESUPA que conecta ciencia, tecnología y saberes amazónicos.",
};

export function OrganizationJsonLd({ locale }: { locale: Locale }) {
  const data: Json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Amazon Hacking",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    inLanguage: HREFLANG[locale],
    sameAs: [
      "https://www.instagram.com/amazon.hacking/",
      "https://www.youtube.com/@CESUPAonline",
    ],
    parentOrganization: {
      "@type": "EducationalOrganization",
      name: "CESUPA",
      url: "https://www.cesupa.br",
    },
    description: orgDescription[locale],
  };

  return <JsonLd data={data} />;
}

function eventDescription(
  locale: Locale,
  number: number,
  year: number,
  theme: string,
): string {
  switch (locale) {
    case "en":
      return `Amazon Hacking ${year} (edition ${number}) — ${theme}`;
    case "es":
      return `${number}ª edición del Amazon Hacking — ${theme}`;
    default:
      return `${number}ª edição do Amazon Hacking — ${theme}`;
  }
}

export function EventJsonLd({
  year,
  number,
  theme,
  location,
  locale,
}: {
  year: number;
  number: number;
  theme: string;
  location: string;
  locale: Locale;
}) {
  const data: Json = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `Amazon Hacking ${year}`,
    description: eventDescription(locale, number, year, theme),
    inLanguage: HREFLANG[locale],
    startDate: `${year}-01-01`,
    location: { "@type": "Place", name: location, address: location },
    organizer: { "@type": "Organization", name: "CESUPA", url: "https://www.cesupa.br" },
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
  };
  return <JsonLd data={data} />;
}

function JsonLd({ data }: { data: Json }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
