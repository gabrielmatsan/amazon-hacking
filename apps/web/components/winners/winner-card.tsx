"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Locale } from "@/lib/paraglide/runtime";
import type { Winner } from "@/lib/content/types";
import { trackEvent } from "@/lib/analytics/umami";

const prizeLabels: Record<string, Record<Locale, string>> = {
  champion: { "pt-br": "Campeão", en: "Champion", es: "Campeón" },
  second_place: { "pt-br": "2º lugar", en: "2nd place", es: "2.º lugar" },
  third_place: { "pt-br": "3º lugar", en: "3rd place", es: "3.er lugar" },
  public_choice: { "pt-br": "Prêmio Público", en: "Public Choice", es: "Premio del Público" },
  community_choice: { "pt-br": "Prêmio Comunidade", en: "Community Choice", es: "Premio Comunidad" },
  technical: { "pt-br": "Prêmio Técnico", en: "Technical Award", es: "Premio Técnico" },
  innovation: { "pt-br": "Prêmio Inovação", en: "Innovation Award", es: "Premio Innovación" },
};

export function WinnerCard({ winner, locale }: { winner: Winner; locale: Locale }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const watchLabel =
    locale === "pt-br" ? "Conheça a solução" : locale === "en" ? "Explore the project" : "Conocé el proyecto";
  const teamLabel = locale === "pt-br" ? "Equipe" : locale === "en" ? "Team" : "Equipo";

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5 transition hover:-translate-y-1 hover:shadow-xl">
        <div className="relative aspect-[5/3] overflow-hidden bg-primary-400">
          {winner.logoUrl && (
            <Image
              src={winner.logoUrl}
              alt={winner.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain p-6 transition duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            {winner.prizes.map((prize) => (
              <span
                key={prize}
                className="rounded-full bg-primary-100 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-white uppercase"
              >
                {prizeLabels[prize]?.[locale] ?? prize}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-6">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-xl font-bold text-black">{winner.name}</h3>
            <span className="shrink-0 text-xs font-bold text-neutrals-400">{winner.year}</span>
          </div>
          {winner.course && (
            <span className="-mt-1 text-[11px] font-medium tracking-wide text-primary-100">
              {winner.course}
            </span>
          )}
          <p className="line-clamp-3 text-sm leading-relaxed text-neutrals-500">
            {winner.description}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-neutrals-400">
            {winner.team.map((member) => member.name).join(" · ")}
          </p>
          {winner.videoUrl && (
            <button
              type="button"
              onClick={() => {
                trackEvent("winner-video-play", { winnerId: winner.id, year: winner.year });
                setOpen(true);
              }}
              className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-primary-100 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-primary-200"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
                <path d="M2 1.5v9l8-4.5z" />
              </svg>
              {watchLabel}
            </button>
          )}
        </div>
      </article>

      {open && winner.videoUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={winner.name}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white"
          >
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
            <div className="aspect-video w-full bg-black">
              <iframe
                className="h-full w-full"
                src={winner.videoUrl}
                title={winner.name}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {winner.prizes.map((prize) => (
                  <span
                    key={prize}
                    className="rounded-full bg-primary-100 px-3 py-1 text-[10px] font-bold tracking-[0.12em] text-white uppercase"
                  >
                    {prizeLabels[prize]?.[locale] ?? prize}
                  </span>
                ))}
                <span className="text-xs font-bold text-neutrals-400">{winner.year}</span>
              </div>
              <h3 className="mt-4 text-2xl font-bold text-black">{winner.name}</h3>
              {winner.course && (
                <p className="mt-1 text-sm font-medium text-primary-100">{winner.course}</p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-neutrals-600 md:text-base">
                {winner.description}
              </p>
              <p className="mt-6 text-xs font-bold tracking-[0.16em] text-neutrals-400 uppercase">
                {teamLabel}
              </p>
              <p className="mt-2 text-sm text-neutrals-600">
                {winner.team.map((member) => member.name).join(" · ")}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
