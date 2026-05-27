import Image from "next/image";
import { getLocale } from "@/lib/paraglide/runtime";
import { m } from "@/lib/paraglide/messages";
import { Reveal, RevealGroup } from "@/components/site/reveal";

const goals = [
  {
    id: "imersao",
    title: { "pt-br": "Imersão Educacional", en: "Educational Immersion", es: "Inmersión Educativa" },
    body: { "pt-br": "Experiências imersivas em comunidades amazônicas para os alunos.", en: "Immersive experiences in Amazonian communities for students.", es: "Experiencias inmersivas en comunidades amazónicas para los estudiantes." },
  },
  {
    id: "mercado",
    title: { "pt-br": "Interação com Mercado", en: "Market Interaction", es: "Interacción con el Mercado" },
    body: { "pt-br": "Inter-relacionamento entre alunos e empresas de tecnologia.", en: "Connection between students and technology companies.", es: "Relación entre estudiantes y empresas de tecnología." },
  },
  {
    id: "inovacao",
    title: { "pt-br": "Inovação Amazônica", en: "Amazonian Innovation", es: "Innovación Amazónica" },
    body: { "pt-br": "Fomentar soluções tecnológicas e empreendedoras na região.", en: "Foster tech and entrepreneurial solutions in the region.", es: "Fomentar soluciones tecnológicas y emprendedoras en la región." },
  },
  {
    id: "rede",
    title: { "pt-br": "Rede Inovadora", en: "Innovation Network", es: "Red Innovadora" },
    body: { "pt-br": "Fortalecer o ecossistema de inovação e networking.", en: "Strengthen the innovation and networking ecosystem.", es: "Fortalecer el ecosistema de innovación y networking." },
  },
];

const numbers = [
  { value: "337", label: { "pt-br": "Alunos", en: "Students", es: "Estudiantes" } },
  { value: "38", label: { "pt-br": "Equipes inscritas", en: "Registered Teams", es: "Equipos inscritos" } },
  { value: "43", label: { "pt-br": "Mentores", en: "Mentors", es: "Mentores" } },
];

export function AboutSection() {
  const locale = getLocale();

  return (
    <section id="sobre">
      {/* White intro block */}
      <div className="relative bg-white pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="mx-auto grid max-w-screen-2xl items-center gap-12 px-8 lg:grid-cols-2 lg:px-16">
          <Reveal as="div" from="right" className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <h2 className="text-3xl leading-tight font-bold sm:text-4xl text-black md:text-5xl lg:text-6xl">
              {m.about_title()}
            </h2>
            <p className="max-w-[60ch] text-base leading-relaxed text-neutrals-600 md:text-lg">
              {m.about_paragraph_1()}
            </p>
            <a
              href="#numeros"
              className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-primary-200"
            >
              {m.about_eyebrow()}
              <span aria-hidden>→</span>
            </a>
          </Reveal>
          <div className="relative aspect-[4/3] w-full">
            <Image
              src="/illustrations/About-Main.svg"
              alt=""
              fill
              className="object-contain"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {/* Dark numbers block */}
      <div id="numeros" className="relative bg-neutrals-700 py-20 text-white md:py-28">
        <div
          aria-hidden
          className="absolute inset-x-0 top-1/4 h-16 bg-symbol bg-contain bg-repeat opacity-10"
        />
        <div className="mx-auto max-w-screen-2xl px-6 lg:px-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-5 text-center lg:text-left">
              <h3 className="text-4xl font-bold md:text-5xl lg:text-6xl">
                {locale === "pt-br"
                  ? "O que buscamos?"
                  : locale === "en"
                    ? "What we pursue"
                    : "¿Qué buscamos?"}
              </h3>
              <p className="max-w-[58ch] text-base leading-relaxed text-white/85 md:text-lg">
                {m.about_paragraph_2()}
              </p>
            </div>
            <Image
              src="/illustrations/About-Goal-Image.svg"
              alt=""
              width={420}
              height={320}
              className="mx-auto hidden h-auto w-full max-w-sm lg:block"
              aria-hidden
            />
          </div>

          {/* Goal cards */}
          <RevealGroup className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {goals.map((goal) => (
              <Reveal
                as="div"
                key={goal.id}
                className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 backdrop-blur-sm transition hover:bg-white/10"
              >
                <h4 className="text-lg font-bold text-secondary-300">
                  {goal.title[locale]}
                </h4>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  {goal.body[locale]}
                </p>
              </Reveal>
            ))}
          </RevealGroup>

          {/* Number counters */}
          <dl className="mt-16 grid grid-cols-3 gap-6 border-t border-white/10 pt-12 text-center">
            {numbers.map((n) => (
              <div key={n.value}>
                <dt className="text-4xl font-bold text-white md:text-7xl">
                  {n.value}
                </dt>
                <dd className="mt-2 text-xs tracking-[0.14em] text-white/60 uppercase md:text-sm">
                  {n.label[locale]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
