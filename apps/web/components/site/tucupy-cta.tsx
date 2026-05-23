import Image from "next/image";
import { m } from "@/lib/paraglide/messages";
import type { Locale } from "@/lib/paraglide/runtime";

export function TucupyCta({ locale }: { locale: Locale }) {
  return (
    <section className="bg-white px-6 py-16 md:py-24">
      <div className="mx-auto max-w-screen-xl">
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#191919] px-6 py-16 text-center shadow-2xl sm:px-16 md:py-24 lg:text-left">
          <svg
            viewBox="0 0 1024 1024"
            aria-hidden
            className="absolute top-1/2 left-1/2 -z-10 h-[48rem] w-[48rem] -translate-x-1/2 -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
          >
            <circle cx="512" cy="512" r="512" fill="url(#tucupy-glow)" fillOpacity="0.7" />
            <defs>
              <radialGradient id="tucupy-glow">
                <stop stopColor="#FEBE01" />
                <stop offset="1" stopColor="#191919" />
              </radialGradient>
            </defs>
          </svg>

          <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 lg:mx-0 lg:items-start">
            <Image
              src="/illustrations/tucupy-logo.svg"
              alt="Tucupy Tecnologia"
              width={180}
              height={76}
              className="h-11 w-auto"
            />
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {m.tucupy_cta_title({}, { locale })}
              </h2>
              <p className="mt-6 text-base leading-relaxed text-white/70 md:text-lg">
                {m.tucupy_cta_description({}, { locale })}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
              <a
                href="https://www.tucupy.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-[#FEBE01] px-6 py-3 text-sm font-bold text-[#191919] shadow-sm transition hover:bg-[#e0a800]"
              >
                {m.tucupy_cta_primary({}, { locale })}
              </a>
              <a
                href="https://www.instagram.com/tucupytecnologia"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-white transition hover:text-white/70"
              >
                {m.tucupy_cta_secondary({}, { locale })} <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
