import Image from "next/image";
import { getLocale } from "@/lib/paraglide/runtime";
import { m } from "@/lib/paraglide/messages";
import { WaveDivider } from "@/components/site/wave-divider";
import { Reveal, RevealGroup } from "@/components/site/reveal";
import { partnersByTier } from "@/lib/content/partners";
import type { Partner } from "@/lib/content/types";

const tierLabels = {
  sponsors: { "pt-br": "Patrocinadoras", en: "Sponsors", es: "Patrocinadoras" },
  support: { "pt-br": "Parceiros", en: "Partners", es: "Socios" },
  godmothers: { "pt-br": "Madrinhas", en: "Godmothers", es: "Madrinas" },
  ticketing: { "pt-br": "Ticketeira Oficial", en: "Official Ticketing", es: "Ticketera Oficial" },
} as const;

function LogoRow({
  items,
  size,
}: {
  items: Partner[];
  size: "lg" | "md" | "sm";
}) {
  const box =
    size === "lg" ? "h-24 w-56" : size === "md" ? "h-16 w-40" : "h-12 w-32";
  return (
    <RevealGroup
      className="flex flex-wrap items-center justify-center gap-x-8 gap-y-8 sm:gap-x-12"
      stagger={0.08}
    >
      {items.map((partner) => (
        <Reveal as="div" key={partner.id} className={`relative ${box}`}>
          <Image
            src={partner.logoUrl}
            alt={partner.name}
            fill
            className={`object-contain transition hover:scale-105 ${partner.skipFilter ? "mix-blend-screen" : "brightness-0 invert"}`}
          />
        </Reveal>
      ))}
    </RevealGroup>
  );
}

export function PartnersGrid() {
  const locale = getLocale();

  return (
    <section id="parceiros" className="relative bg-white pt-20 md:pt-28">
      <Reveal as="div" className="mx-auto max-w-screen-2xl px-8 text-center lg:px-16">
        <span className="text-sm font-bold tracking-[0.16em] text-primary-100 uppercase">
          {m.partners_eyebrow()}
        </span>
        <h2 className="mx-auto mt-4 max-w-3xl text-3xl leading-tight font-bold sm:text-4xl text-black md:text-5xl lg:text-6xl">
          {m.partners_title()}
        </h2>
      </Reveal>

      {/* Tiered, stacked color bands joined by waves */}
      <div className="mt-12">
        <WaveDivider from="#ffffff" to="#0165b7" />
        <div className="bg-primary-100 px-8 pb-16 text-center">
          <Reveal as="h3" className="text-2xl font-bold text-white md:text-4xl">
            {tierLabels.sponsors[locale]}
          </Reveal>
          <div className="mt-10">
            <LogoRow items={partnersByTier.platinum} size="lg" />
          </div>
        </div>

        <WaveDivider from="#0165b7" to="#005194" />
        <div className="bg-primary-200 px-8 pb-16 text-center">
          <Reveal as="h3" className="text-2xl font-bold text-white md:text-4xl">
            {tierLabels.support[locale]}
          </Reveal>
          <div className="mt-10">
            <LogoRow items={partnersByTier.gold} size="md" />
          </div>
        </div>

        <WaveDivider from="#005194" to="#0a0a0a" />
        <div className="bg-neutrals-700 px-8 pb-16 text-center">
          <Reveal as="h3" className="text-2xl font-bold text-white md:text-4xl">
            {tierLabels.godmothers[locale]}
          </Reveal>
          <div className="mt-10">
            <LogoRow items={partnersByTier.silver} size="sm" />
          </div>
        </div>

        <WaveDivider from="#0a0a0a" to="#014780" />
        <div className="bg-primary-300 px-8 pb-16 text-center">
          <Reveal as="h3" className="text-2xl font-bold text-white md:text-4xl">
            {tierLabels.ticketing[locale]}
          </Reveal>
          <div className="mt-10">
            <LogoRow items={partnersByTier.ticketing} size="md" />
          </div>
        </div>
        <WaveDivider from="#014780" to="#ffffff" />
      </div>
    </section>
  );
}
