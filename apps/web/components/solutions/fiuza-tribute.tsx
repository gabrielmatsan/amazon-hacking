import Image from "next/image";
import { m } from "@/lib/paraglide/messages";
import type { Locale } from "@/lib/paraglide/runtime";
import { Reveal, RevealGroup } from "@/components/site/reveal";

export function FiuzaTribute({ locale }: { locale: Locale }) {
  return (
    <section className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-screen-xl px-6 lg:px-16">
        <RevealGroup className="grid items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-20">
          <Reveal as="div" from="right" className="relative mx-auto w-full max-w-sm">
            <div
              aria-hidden
              className="absolute -inset-3 -rotate-2 rounded-3xl bg-primary-100/10"
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl outline-1 -outline-offset-1 outline-black/10">
              <Image
                src="/photos/fiuza.jpeg"
                alt={m.fiuza_photo_alt({}, { locale })}
                fill
                sizes="(min-width: 1024px) 24rem, (min-width: 640px) 24rem, 100vw"
                className="object-cover object-[50%_35%]"
              />
            </div>
          </Reveal>

          <Reveal as="div" from="left" className="text-center lg:text-left">
            <span className="text-sm font-bold tracking-[0.16em] text-primary-100 uppercase">
              {m.fiuza_eyebrow({}, { locale })}
            </span>
            <h2 className="mx-auto mt-4 max-w-[30ch] text-3xl font-bold tracking-tight text-balance text-black sm:text-4xl md:text-5xl lg:mx-0">
              {m.fiuza_title({}, { locale })}
            </h2>
            <p className="mx-auto mt-6 max-w-[60ch] text-base leading-relaxed text-pretty text-neutrals-600 md:text-lg lg:mx-0">
              {m.fiuza_text_1({}, { locale })}
            </p>
            <p className="mx-auto mt-4 max-w-[60ch] text-base leading-relaxed text-pretty text-neutrals-600 md:text-lg lg:mx-0">
              {m.fiuza_text_2({}, { locale })}
            </p>
          </Reveal>
        </RevealGroup>
      </div>
    </section>
  );
}
