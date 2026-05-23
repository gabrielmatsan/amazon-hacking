import { getLocale } from "@/lib/paraglide/runtime";
import { m } from "@/lib/paraglide/messages";
import { edition2026 } from "@/lib/content/editions";
import { Reveal, RevealGroup } from "@/components/site/reveal";

export function EixosGrid() {
  const locale = getLocale();
  const axes = edition2026.axes ?? [];

  return (
    <section id="eixos" className="relative bg-white py-20 md:py-28">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-16">
        <Reveal as="div" className="max-w-3xl">
          <span className="text-sm font-bold tracking-[0.16em] text-primary-100 uppercase">
            {m.eixos_eyebrow()}
          </span>
          <h2 className="mt-4 text-3xl leading-tight font-bold sm:text-4xl text-black md:text-5xl lg:text-6xl">
            {m.eixos_title()}
          </h2>
          <p className="mt-6 text-lg text-neutrals-600 md:text-xl">
            {m.eixos_lead()}
          </p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {axes.map((axis) => (
            <Reveal
              as="div"
              key={axis.id}
              className="group rounded-2xl border border-neutrals-200 bg-white p-7 transition hover:border-primary-100 hover:shadow-lg md:p-8"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-white">
                  {axis.number}
                </span>
                <span className="h-px flex-1 bg-neutrals-200" />
              </div>
              <h3 className="mt-5 text-xl leading-tight font-bold text-black md:text-2xl">
                {axis.title[locale]}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-neutrals-500 md:text-base">
                {axis.description[locale]}
              </p>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
