import { getLocale } from "@/lib/paraglide/runtime";
import { m } from "@/lib/paraglide/messages";
import { WinnerCard } from "@/components/winners/winner-card";
import { winners, winnerYears } from "@/lib/content/winners";
import { Reveal, RevealGroup } from "@/components/site/reveal";

export function WinnersSection() {
  const locale = getLocale();
  const years = winnerYears();

  return (
    <section id="vencedores" className="relative bg-primary-400 py-20 text-white md:py-28">
      <div
        aria-hidden
        className="absolute inset-x-0 top-12 h-16 bg-symbol bg-contain bg-repeat opacity-10"
      />
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-16">
        <Reveal as="div" className="max-w-3xl">
          <span className="text-sm font-bold tracking-[0.16em] text-secondary-300 uppercase">
            {m.winners_eyebrow()}
          </span>
          <h2 className="mt-4 text-3xl leading-tight font-bold sm:text-4xl md:text-5xl lg:text-6xl">
            {m.winners_title()}
          </h2>
        </Reveal>

        <div className="mt-14 space-y-16">
          {years.map((year) => {
            const yearWinners = winners.filter((winner) => winner.year === year);
            return (
              <div key={year}>
                <div className="mb-7 flex items-baseline gap-4 border-b border-white/15 pb-3">
                  <h3 className="text-4xl font-bold">{year}</h3>
                  <span className="text-xs tracking-[0.14em] text-white/60 uppercase">
                    {yearWinners.length}{" "}
                    {locale === "pt-br" ? "projetos" : locale === "en" ? "projects" : "proyectos"}
                  </span>
                </div>
                <RevealGroup className="grid items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {yearWinners.map((winner) => (
                    <Reveal as="div" key={winner.id} className="h-full">
                      <WinnerCard winner={winner} locale={locale} />
                    </Reveal>
                  ))}
                </RevealGroup>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
