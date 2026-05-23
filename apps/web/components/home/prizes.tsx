import { m } from "@/lib/paraglide/messages";
import { Reveal, RevealGroup } from "@/components/site/reveal";

export function PrizesSection() {
  const prizes = [
    {
      name: m.prize_public_name(),
      description: m.prize_public_description(),
      accent: "bg-primary-100",
    },
    {
      name: m.prize_community_name(),
      description: m.prize_community_description(),
      accent: "bg-secondary-100",
    },
    {
      name: m.prize_technical_name(),
      description: m.prize_technical_description(),
      accent: "bg-primary-300",
    },
  ];

  return (
    <section id="premios" className="relative bg-white py-20 md:py-28">
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-16">
        <Reveal as="div" className="max-w-3xl">
          <span className="text-sm font-bold tracking-[0.16em] text-primary-100 uppercase">
            {m.prizes_eyebrow()}
          </span>
          <h2 className="mt-4 text-3xl leading-tight font-bold sm:text-4xl text-black md:text-5xl lg:text-6xl">
            {m.prizes_title()}
          </h2>
          <p className="mt-6 text-lg text-neutrals-600 md:text-xl">{m.prizes_lead()}</p>
        </Reveal>

        <RevealGroup className="mt-14 grid gap-6 md:grid-cols-3">
          {prizes.map((prize, index) => (
            <Reveal
              as="div"
              key={prize.name}
              className="flex flex-col gap-5 rounded-2xl border border-neutrals-200 bg-white p-8 transition hover:shadow-lg"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${prize.accent}`}
              >
                {index + 1}
              </span>
              <h3 className="text-2xl font-bold text-black">{prize.name}</h3>
              <p className="text-sm leading-relaxed text-neutrals-500 md:text-base">
                {prize.description}
              </p>
            </Reveal>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
