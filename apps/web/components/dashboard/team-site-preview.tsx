"use client";

import { useEffect, useState } from "react";
import type { Team, SolutionPillar } from "@/lib/api/types";

const PILLAR_LABELS: Record<string, string> = {
  digital_agriculture: "Agricultura Digital",
  bioeconomy: "Bioeconomia",
  logistics: "Logística",
  education: "Educação",
  health: "Saúde",
  default: "Outro",
};

const PILLAR_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  digital_agriculture: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  bioeconomy: { bg: "bg-lime-50", text: "text-lime-700", ring: "ring-lime-200" },
  logistics: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  education: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  health: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  default: { bg: "bg-neutral-100", text: "text-neutral-600", ring: "ring-neutral-200" },
};

function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/embed/")[1] ?? null;
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1);
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

export function TeamSitePreview({
  team,
  onClose,
}: {
  team: Team;
  onClose: () => void;
}) {
  const defaultColors = { bg: "bg-neutral-100", text: "text-neutral-600", ring: "ring-neutral-200" };
  const colors = PILLAR_COLORS[team.solutionPillar as keyof typeof PILLAR_COLORS] ?? defaultColors;
  const primaryId = team.videoUrl ? extractVideoId(team.videoUrl) : null;
  const secondaryId = team.secondaryVideoUrl ? extractVideoId(team.secondaryVideoUrl) : null;
  const hasBothVideos = !!primaryId && !!secondaryId;
  const [activeVideo, setActiveVideo] = useState<"primary" | "secondary">("primary");
  const activeVideoId = activeVideo === "primary" ? primaryId : secondaryId;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    window.history.pushState({ preview: true }, "");

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    function handlePopState() {
      onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white/95 px-6 py-3 backdrop-blur-sm">
        <p className="text-sm font-medium text-neutral-500">
          Preview — como a equipe aparecerá no site
        </p>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" aria-hidden>
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Voltar
        </button>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Header igual ao team-detail.tsx */}
        <div className="flex items-center gap-5">
          <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary-400 md:size-24">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt=""
                className="size-full object-contain p-2"
              />
            ) : (
              <span className="text-3xl font-semibold text-white">
                {team.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}
            >
              {PILLAR_LABELS[team.solutionPillar] ?? team.solutionPillar}
            </span>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black text-balance md:text-4xl">
              {team.name}
            </h1>
          </div>
        </div>

        {/* Vídeos */}
        {activeVideoId && (
          <div className="mt-10">
            {hasBothVideos && (
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveVideo("primary")}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    activeVideo === "primary"
                      ? "bg-primary-100 text-white"
                      : "bg-neutral-100 text-neutral-500 ring-1 ring-black/5 hover:bg-neutral-200"
                  }`}
                >
                  Pitch
                </button>
                <button
                  type="button"
                  onClick={() => setActiveVideo("secondary")}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    activeVideo === "secondary"
                      ? "bg-primary-100 text-white"
                      : "bg-neutral-100 text-neutral-500 ring-1 ring-black/5 hover:bg-neutral-200"
                  }`}
                >
                  Pitch (English)
                </button>
              </div>
            )}
            <div className="overflow-hidden rounded-2xl">
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  src={`https://www.youtube.com/embed/${activeVideoId}?rel=0`}
                  title={team.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 size-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Descrição */}
        {team.description && (
          <div className="mt-10">
            <p className="text-base leading-relaxed text-neutral-600 text-pretty md:text-lg whitespace-pre-line">
              {team.description}
            </p>
          </div>
        )}

        {/* Membros */}
        {team.teamMembers && team.teamMembers.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xs font-semibold tracking-[0.16em] text-primary-100 uppercase">
              Equipe
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              Conheça os membros desta equipe.
            </p>
            <ul
              role="list"
              className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {team.teamMembers.map((member, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-xl bg-neutral-50 px-4 py-3 ring-1 ring-black/5"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-white">
                    {member.name.charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-black">
                      {member.name}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      {member.role}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Seção de voto (mock, apenas visual) */}
        <div className="mt-12 rounded-2xl bg-primary-100/5 p-6 ring-1 ring-primary-100/10 md:p-8">
          <p className="text-lg font-semibold text-black">
            Vote nesta equipe!
          </p>
          <p className="mt-1 text-sm leading-relaxed text-neutral-500 text-pretty">
            Para votar, faça login com sua conta Google e valide seu número de
            telefone.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-neutral-200 px-5 py-3 text-sm font-semibold text-neutral-400">
            Seção de votação (preview)
          </div>
        </div>
      </div>
    </div>
  );
}
