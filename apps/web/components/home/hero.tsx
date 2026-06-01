"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { m } from "@/lib/paraglide/messages";
import type { Locale } from "@/lib/paraglide/runtime";

const fadeRight = {
  hidden: { opacity: 0, x: -16 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function Hero({ locale }: { locale: Locale }) {
  return (
    <section
      id="hero"
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden bg-primary-400 px-0 pt-28 pb-16 md:pt-32 md:pb-24"
    >
      <Image
        src="/photos/Hero-Bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover object-center"
        aria-hidden
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-primary-100/70 mix-blend-soft-light" />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-t from-primary-400/85 via-primary-400/35 to-primary-400/55"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-[10%] -z-10 h-16 bg-symbol bg-contain bg-repeat opacity-15"
      />

      <div className="mx-auto grid w-full max-w-screen-2xl items-center gap-10 px-6 lg:grid-cols-2 lg:gap-16 lg:px-12">
        <div className="flex flex-col gap-6 text-white md:gap-8">
          <motion.p
            custom={0}
            variants={fadeRight}
            initial="hidden"
            animate="show"
            className="text-xs font-bold tracking-[0.18em] text-white/80 uppercase md:text-sm"
          >
            {m.hero_eyebrow({}, { locale })}
          </motion.p>
          <motion.h1
            custom={1}
            variants={fadeRight}
            initial="hidden"
            animate="show"
            className="text-[2rem] leading-[1.08] font-bold uppercase sm:text-4xl md:text-5xl lg:text-6xl"
          >
            {m.hero_title({}, { locale })}
          </motion.h1>
          <motion.p
            custom={2}
            variants={fadeRight}
            initial="hidden"
            animate="show"
            className="max-w-[54ch] text-base leading-relaxed text-white/90 md:text-lg lg:text-xl"
          >
            {m.hero_subtitle({}, { locale })}
          </motion.p>
          <motion.div
            custom={3}
            variants={fadeRight}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4"
          >
            <Link
              href="#moju"
              data-umami-event="cta-click"
              data-umami-event-target="hero-primary"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-primary-100 transition hover:bg-white/90"
            >
              {m.hero_cta_primary({}, { locale })}
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="#vencedores"
              data-umami-event="cta-click"
              data-umami-event-target="hero-winners"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 px-7 py-3.5 text-sm font-bold text-white transition hover:border-white"
            >
              {m.hero_cta_secondary({}, { locale })}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="aspect-video w-full overflow-hidden rounded-2xl shadow-2xl lg:max-w-[576px] lg:justify-self-end"
        >
          <iframe
            className="h-full w-full"
            src="https://www.youtube.com/embed/8OJqKZWoy4w"
            title="Amazon Hacking"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            loading="lazy"
          />
        </motion.div>
      </div>
    </section>
  );
}
