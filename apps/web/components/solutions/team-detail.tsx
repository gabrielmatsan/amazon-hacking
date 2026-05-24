"use client";

import Image from "next/image";
import Link from "next/link";
import { YouTubeEmbed } from "@next/third-parties/google";
import { m } from "@/lib/paraglide/messages";
import type { Locale } from "@/lib/paraglide/runtime";
import { useTeamBySlug } from "@/hooks/use-teams";
import { useMyVote } from "@/hooks/use-votes";
import type { SolutionPillar } from "@/lib/api/types";

function pillarLabel(pillar: SolutionPillar, locale: Locale): string {
  const labels: Record<SolutionPillar, () => string> = {
    digital_agriculture: () => m.pillar_digital_agriculture({}, { locale }),
    bioeconomy: () => m.pillar_bioeconomy({}, { locale }),
    logistics: () => m.pillar_logistics({}, { locale }),
    education: () => m.pillar_education({}, { locale }),
    health: () => m.pillar_health({}, { locale }),
    default: () => m.pillar_default({}, { locale }),
  };
  return labels[pillar]();
}

const PILLAR_COLORS: Record<SolutionPillar, { bg: string; text: string; ring: string }> = {
  digital_agriculture: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
  bioeconomy: { bg: "bg-lime-50", text: "text-lime-700", ring: "ring-lime-200" },
  logistics: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-200" },
  education: { bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-200" },
  health: { bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-200" },
  default: { bg: "bg-neutrals-100", text: "text-neutrals-600", ring: "ring-neutrals-200" },
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

function backHref(locale: Locale): string {
  return locale === "pt-br" ? "/solucoes" : `/${locale}/solucoes`;
}

export function TeamDetail({ slug, locale }: { slug: string; locale: Locale }) {
  const { data: team, isLoading, error } = useTeamBySlug(slug);
  const { data: myVote } = useMyVote();

  const hasVoted = !!myVote;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="size-10 animate-spin rounded-full border-4 border-primary-100/30 border-t-primary-100" />
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="mx-auto max-w-2xl px-6 text-center">
        <p className="text-lg text-neutrals-500">{m.solutions_no_results({}, { locale })}</p>
        <Link
          href={backHref(locale)}
          className="mt-6 inline-flex rounded-full bg-primary-100 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-200"
        >
          {m.nav_solutions({}, { locale })}
        </Link>
      </div>
    );
  }

  const colors = PILLAR_COLORS[team.solutionPillar];

  return (
    <div className="mx-auto max-w-4xl px-6">
      {/* Back link */}
      <Link
        href={backHref(locale)}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-100 hover:text-primary-200"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0" aria-hidden>
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" fill="none" />
        </svg>
        {m.nav_solutions({}, { locale })}
      </Link>

      {/* Header */}
      <div className="mt-8 flex items-center gap-5">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-primary-400 md:size-24">
          {team.logoUrl ? (
            <Image
              src={team.logoUrl}
              alt=""
              fill
              sizes="96px"
              className="object-contain p-2"
            />
          ) : (
            <span className="flex size-full items-center justify-center text-3xl font-semibold text-white">
              {team.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${colors.bg} ${colors.text} ${colors.ring}`}>
            {pillarLabel(team.solutionPillar, locale)}
          </span>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black text-balance md:text-4xl">
            {team.name}
          </h1>
        </div>
      </div>

      {/* Video */}
      {team.videoUrl && (() => {
        const videoId = extractVideoId(team.videoUrl!);
        if (!videoId) return null;
        return (
          <div className="mt-10 overflow-hidden rounded-2xl">
            <YouTubeEmbed videoid={videoId} params="rel=0" />
          </div>
        );
      })()}

      {/* Description */}
      {team.description && (
        <div className="mt-10">
          <p className="text-base leading-relaxed text-neutrals-600 text-pretty md:text-lg">
            {team.description}
          </p>
        </div>
      )}

      {/* Team members */}
      {team.teamMembers && team.teamMembers.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xs font-semibold tracking-[0.16em] text-primary-100 uppercase">
            {m.solution_team({}, { locale })}
          </h2>
          <p className="mt-1 text-sm text-neutrals-500">
            {m.solution_team_description({}, { locale })}
          </p>
          <ul role="list" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {team.teamMembers.map((member) => (
              <li
                key={member.name}
                className="flex items-center gap-3 rounded-xl bg-neutrals-100/50 px-4 py-3 ring-1 ring-black/5"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-white">
                  {member.name.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-black">{member.name}</p>
                  <p className="truncate text-xs text-neutrals-400">{member.role}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Vote */}
      <div className="mt-12 rounded-2xl bg-primary-100/5 p-6 ring-1 ring-primary-100/10 md:p-8">
        <p className="text-lg font-semibold text-black">
          {m.vote_title({}, { locale })}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-neutrals-500 text-pretty">
          {m.vote_description({}, { locale })}
        </p>
        {hasVoted ? (
          <>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary-100 px-5 py-3 text-sm font-semibold text-white">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8.5l3.5 3.5L13 4.5" stroke="currentColor" strokeWidth="2" />
              </svg>
              {m.vote_voted({}, { locale })}
            </div>
            <p className="mt-3 text-xs text-neutrals-400">
              {m.vote_thanks({}, { locale })}
            </p>
          </>
        ) : (
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary-100 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-200"
          >
            {m.vote_button({}, { locale })}
          </button>
        )}
      </div>
    </div>
  );
}
