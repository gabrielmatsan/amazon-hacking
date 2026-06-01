import { m } from "@/lib/paraglide/messages";
import { Reveal } from "@/components/site/reveal";

export function FinalCta() {
  return (
    <section id="contato" className="relative bg-white py-20 text-center md:py-28">
      <Reveal as="div" className="mx-auto max-w-2xl px-8">
        <h2 className="text-3xl leading-tight font-bold sm:text-4xl text-black md:text-5xl lg:text-6xl">
          {m.cta_final_title()}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-neutrals-600">
          {m.cta_final_subtitle()}
        </p>
        <a
          href="mailto:amazon.hacking@cesupa.br"
          data-umami-event="cta-click"
          data-umami-event-target="final-email"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-primary-100 px-8 py-4 text-sm font-bold text-white transition hover:bg-primary-200"
        >
          {m.cta_final_button()}
          <span aria-hidden>→</span>
        </a>
      </Reveal>
    </section>
  );
}
