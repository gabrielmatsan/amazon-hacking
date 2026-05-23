import { getLocale } from "@/lib/paraglide/runtime";
import { m } from "@/lib/paraglide/messages";
import { allEditions } from "@/lib/content/editions";
import { Reveal, RevealGroup } from "@/components/site/reveal";

export function EditionsTimeline() {
  const locale = getLocale();

  const ordinal = (n: number) =>
    locale === "en" ? `${n}th edition` : `${n}ª edição`;
  const challengesLabel =
    locale === "pt-br"
      ? "Desafios encontrados"
      : locale === "en"
        ? "Challenges faced"
        : "Desafíos encontrados";

  return (
    <section id="edicoes" className="relative bg-neutrals-100 py-20 md:py-28">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-16">
        <Reveal as="div" className="max-w-3xl">
          <span className="text-sm font-bold tracking-[0.16em] text-primary-100 uppercase">
            {m.editions_eyebrow()}
          </span>
          <h2 className="mt-4 text-3xl leading-tight font-bold text-black sm:text-4xl md:text-5xl lg:text-6xl">
            {m.editions_title()}
          </h2>
          <p className="mt-6 text-lg text-neutrals-600 md:text-xl">
            {m.editions_lead()}
          </p>
        </Reveal>

        <RevealGroup className="relative mt-16 space-y-10 border-l-2 border-primary-100/20 pl-7 md:space-y-14 md:pl-14">
          {allEditions.map((edition) => {
            const isCurrent = edition.year === 2026;
            return (
              <Reveal as="div" from="left" key={edition.year} className="relative">
                <span
                  aria-hidden
                  className={
                    isCurrent
                      ? "absolute -left-[37px] top-1 h-5 w-5 rounded-full bg-primary-100 ring-4 ring-neutrals-100 md:-left-[65px]"
                      : "absolute -left-[33px] top-2 h-3 w-3 rounded-full bg-primary-300 ring-4 ring-neutrals-100 md:-left-[61px]"
                  }
                />

                <div className="overflow-hidden rounded-2xl border border-neutrals-200 bg-white shadow-sm md:rounded-3xl">
                  <div className="grid md:grid-cols-[280px_1fr]">
                    {/* Year + location rail */}
                    <div
                      className={`flex flex-col justify-center gap-2 p-6 md:p-8 ${
                        isCurrent ? "bg-primary-100 text-white" : "bg-neutrals-100 text-black"
                      }`}
                    >
                      <span
                        className={`flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.16em] uppercase ${
                          isCurrent ? "text-white/75" : "text-primary-100"
                        }`}
                      >
                        {ordinal(edition.number)}
                        {isCurrent && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] text-white">
                            {locale === "pt-br" ? "Atual" : locale === "en" ? "Now" : "Actual"}
                          </span>
                        )}
                      </span>
                      <span className="font-display text-5xl font-bold">{edition.year}</span>
                      <span
                        className={`text-sm font-medium ${
                          isCurrent ? "text-white/85" : "text-neutrals-500"
                        }`}
                      >
                        {edition.location}
                      </span>
                    </div>

                    {/* Story */}
                    <div className="p-6 md:p-8">
                      <h3 className="font-display text-2xl font-bold text-black md:text-3xl">
                        {edition.themeName[locale]}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-neutrals-600 md:text-base">
                        {edition.summary[locale]}
                      </p>
                      <div className="mt-5 border-t border-neutrals-200 pt-4">
                        <p className="text-[11px] font-bold tracking-[0.16em] text-primary-100 uppercase">
                          {challengesLabel}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-neutrals-500">
                          {edition.challenges[locale]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </RevealGroup>
      </div>
    </section>
  );
}
