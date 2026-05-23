"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { m } from "@/lib/paraglide/messages";
import type { Locale } from "@/lib/paraglide/runtime";
import type { Winner } from "@/lib/content/types";

type Solution = Winner;

export function SolutionsGallery({
  solutions,
  locale,
}: {
  solutions: Solution[];
  locale: Locale;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Solution | null>(null);
  const [votedId, setVotedId] = useState<string | null>(null);

  useEffect(() => {
    setVotedId(localStorage.getItem("ah-voted-solution"));
  }, []);

  const vote = (id: string) => {
    localStorage.setItem("ah-voted-solution", id);
    setVotedId(id);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return solutions;
    return solutions.filter((s) => s.name.toLowerCase().includes(q));
  }, [query, solutions]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setActive(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [active]);

  return (
    <div className="w-full">
      {/* Search */}
      <div className="mx-auto max-w-md">
        <div className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-lg">
          <svg width="18" height="18" viewBox="0 0 20 20" className="shrink-0 text-neutrals-400" aria-hidden>
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" fill="none" />
            <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={m.solutions_search_placeholder({}, { locale })}
            aria-label={m.solutions_search_placeholder({}, { locale })}
            className="w-full bg-transparent text-sm text-black outline-none placeholder:text-neutrals-400"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="mt-16 text-center text-white/80">
          {m.solutions_no_results({}, { locale })}
        </p>
      ) : (
        <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {filtered.map((solution) => (
            <button
              key={solution.id}
              type="button"
              onClick={() => setActive(solution)}
              className="group flex flex-col items-center gap-4 rounded-2xl bg-white p-5 text-center transition hover:-translate-y-1 hover:shadow-xl md:p-6"
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-full bg-primary-400 ring-2 ring-primary-100/10">
                {solution.logoUrl && (
                  <Image
                    src={solution.logoUrl}
                    alt={solution.name}
                    fill
                    sizes="80px"
                    className="object-contain p-2"
                  />
                )}
              </div>
              <span className="text-base font-bold text-black md:text-lg">{solution.name}</span>
              <span className="mt-auto inline-flex rounded-full bg-primary-100 px-4 py-2 text-xs font-bold text-white transition group-hover:bg-primary-200">
                {m.solution_learn_more({}, { locale })}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.name}
          onClick={() => setActive(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white"
          >
            <button
              type="button"
              aria-label="Fechar"
              onClick={() => setActive(null)}
              className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>

            {active.videoUrl ? (
              <div className="aspect-video w-full bg-black">
                <iframe
                  className="h-full w-full"
                  src={active.videoUrl}
                  title={active.name}
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex aspect-[16/7] w-full items-center justify-center bg-primary-400">
                {active.logoUrl && (
                  <Image
                    src={active.logoUrl}
                    alt={active.name}
                    width={160}
                    height={160}
                    className="h-28 w-auto object-contain"
                  />
                )}
              </div>
            )}

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-neutrals-400">{active.year}</span>
                {active.course && (
                  <span className="text-xs font-medium text-primary-100">{active.course}</span>
                )}
              </div>
              <h3 className="mt-2 text-2xl font-bold text-black">{active.name}</h3>
              <p className="mt-4 text-sm leading-relaxed text-neutrals-600 md:text-base">
                {active.description}
              </p>
              <p className="mt-6 text-xs font-bold tracking-[0.16em] text-primary-100 uppercase">
                {m.solution_team({}, { locale })}
              </p>
              <p className="mt-1 text-xs text-neutrals-500">
                {m.solution_team_description({}, { locale })}
              </p>
              <p className="mt-3 text-sm text-neutrals-600">
                {active.team.map((member) => member.name).join(" · ")}
              </p>

              {/* Vote */}
              <div className="mt-8 rounded-2xl bg-primary-100/5 p-5 ring-1 ring-primary-100/10 md:p-6">
                <p className="text-base font-bold text-black">
                  {m.vote_title({}, { locale })}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-neutrals-500">
                  {m.vote_description({}, { locale })}
                </p>
                {votedId === active.id ? (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary-100 px-5 py-3 text-sm font-bold text-white">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    {m.vote_voted({}, { locale })}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => vote(active.id)}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-100 px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-200"
                  >
                    {m.vote_button({}, { locale })}
                  </button>
                )}
                {votedId === active.id && (
                  <p className="mt-3 text-xs text-neutrals-400">
                    {m.vote_thanks({}, { locale })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
