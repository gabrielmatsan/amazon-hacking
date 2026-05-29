import { getLocale } from "@/lib/paraglide/runtime";
import { m } from "@/lib/paraglide/messages";
import { Reveal } from "@/components/site/reveal";

const stats = [
  { number: "9.094", label: { "pt-br": "km² de território", en: "km² of territory", es: "km² de territorio" } },
  { number: "80k", label: { "pt-br": "habitantes em Moju", en: "Moju inhabitants", es: "habitantes en Moju" } },
  { number: "5ª", label: { "pt-br": "edição do Amazon Hacking", en: "Amazon Hacking edition", es: "edición de Amazon Hacking" } },
];

export function MojuSection() {
  const locale = getLocale();

  return (
    <section
      id="moju"
      className="relative isolate overflow-hidden bg-primary-100 py-20 text-white md:py-28"
    >
      <div
        aria-hidden
        className="absolute inset-x-0 top-10 h-16 bg-symbol bg-contain bg-repeat opacity-10"
      />
      <Reveal as="div" className="mx-auto max-w-screen-2xl px-6 lg:px-16">
        <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold tracking-[0.16em] uppercase">
          {m.moju_eyebrow()}
        </span>
        <h2 className="mt-6 max-w-3xl text-3xl leading-tight font-bold sm:text-4xl md:text-5xl lg:text-6xl">
          {m.moju_title()}
        </h2>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-16">
          <div className="space-y-8">
            <p className="text-lg leading-relaxed text-white/90 md:text-xl">
              {m.moju_lead()}
            </p>
            <p className="text-base leading-relaxed text-white/80 md:text-lg">
              {m.moju_summary()}
            </p>
          </div>

          <dl className="grid grid-cols-1 gap-8 border-l-2 border-white/25 pl-6 lg:mt-1.8 lg:grid-cols-3 lg:gap-10 lg:pl-8">
            {stats.map((stat) => (
              <div key={stat.number}>
                <dt className="text-3xl font-bold text-white lg:text-5xl">
                  {stat.number}
                </dt>
                <dd className="mt-2 text-[10px] tracking-[0.12em] text-white/70 uppercase md:text-xs">
                  {stat.label[locale]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </section>
  );
}
