const SITE_URL = "https://amazonhacking.com.br";

type Json = Record<string, unknown>;

export function OrganizationJsonLd() {
  const data: Json = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Amazon Hacking",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.png`,
    sameAs: [
      "https://www.instagram.com/amazon.hacking/",
      "https://www.youtube.com/@CESUPAonline",
    ],
    parentOrganization: {
      "@type": "EducationalOrganization",
      name: "CESUPA",
      url: "https://www.cesupa.br",
    },
    description:
      "Programa de formação do CESUPA conectando ciência, tecnologia e saberes amazônicos.",
  };

  return <JsonLd data={data} />;
}

export function EventJsonLd({
  year,
  number,
  theme,
  location,
}: {
  year: number;
  number: number;
  theme: string;
  location: string;
}) {
  const data: Json = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `Amazon Hacking ${year}`,
    description: `${number}ª edição do Amazon Hacking — ${theme}`,
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
