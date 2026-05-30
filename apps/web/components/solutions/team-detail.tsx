"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { YouTubeEmbed } from "@next/third-parties/google";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { m } from "@/lib/paraglide/messages";
import type { Locale } from "@/lib/paraglide/runtime";
import { useAuth } from "@/hooks/use-auth";
import { useTeamBySlug } from "@/hooks/use-teams";
import { useMyVote, useRequestVoteToken, useVoteForTeam } from "@/hooks/use-votes";
import { getGoogleLoginUrl } from "@/lib/api/auth";
import type { SolutionPillar, VoteChannel } from "@/lib/api/types";
import { AxiosError } from "axios";

function pillarLabel(pillar: SolutionPillar, locale: Locale): string {
  const labels: Record<SolutionPillar, () => string> = {
    digital_agriculture: () => m.pillar_digital_agriculture({}, { locale }),
    bioeconomy: () => m.pillar_bioeconomy({}, { locale }),
    logistics: () => m.pillar_logistics({}, { locale }),
    education: () => m.pillar_education({}, { locale }),
    health: () => m.pillar_health({}, { locale }),
    verticalization: () => m.pillar_verticalization({}, { locale }),
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
  verticalization: { bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-200" },
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

function getErrorMessage(err: unknown): string | null {
  if (err instanceof AxiosError && err.response?.data?.message) {
    return err.response.data.message;
  }
  return null;
}

export function TeamDetail({ slug, locale }: { slug: string; locale: Locale }) {
  const pathname = usePathname();
  const { data: team, isLoading, error } = useTeamBySlug(slug);
  const { data: user, isLoading: authLoading } = useAuth();
  const { data: myVote } = useMyVote();

  const isLoggedIn = !!user;
  const hasVoted = !!myVote;
  const votedForThisTeam = hasVoted && myVote.teamId === team?.id;
  const loginUrl = getGoogleLoginUrl(pathname);

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
      <Link
        href={backHref(locale)}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-100 hover:text-primary-200"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" className="shrink-0" aria-hidden>
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.8" fill="none" />
        </svg>
        {m.nav_solutions({}, { locale })}
      </Link>

      <div className="mt-8 flex items-center gap-5">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-primary-400 md:size-24">
          {team.logoUrl ? (
            <Image src={team.logoUrl} alt="" fill sizes="96px" className="object-contain p-2" />
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

      <VideoSection
        videoUrl={team.videoUrl}
        secondaryVideoUrl={team.secondaryVideoUrl}
        locale={locale}
      />

      {team.description && (
        <div className="mt-10">
          <p className="text-base leading-relaxed text-neutrals-600 text-pretty md:text-lg">
            {team.description}
          </p>
        </div>
      )}

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

      <div className="mt-12 rounded-2xl bg-primary-100/5 p-6 ring-1 ring-primary-100/10 md:p-8">
        <p className="text-lg font-semibold text-black">
          {m.vote_title({}, { locale })}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-neutrals-500 text-pretty">
          {m.vote_description({}, { locale })}
        </p>

        {authLoading ? (
          <div className="mt-5 size-6 animate-spin rounded-full border-2 border-primary-100/30 border-t-primary-100" />
        ) : hasVoted ? (
          votedForThisTeam ? (
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
            <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-800">
              {m.vote_already_voted_other({}, { locale })}
            </div>
          )
        ) : isLoggedIn ? (
          <VoteFlow teamId={team.id} locale={locale} />
        ) : (
          <>
            <p className="mt-3 text-sm text-neutrals-500">
              {m.vote_login_prompt({}, { locale })}
            </p>
            <a
              href={loginUrl}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black ring-1 ring-black/10 hover:bg-neutrals-100"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              {m.vote_login_button({}, { locale })}
            </a>
          </>
        )}
      </div>
    </div>
  );
}

function VoteFlow({ teamId, locale }: { teamId: string; locale: Locale }) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState<VoteChannel | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const requestToken = useRequestVoteToken();
  const vote = useVoteForTeam();

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!turnstileToken) {
      setErrorMsg("Aguarde a verificação de segurança");
      return;
    }

    requestToken.mutate({ phoneNumber: phone, turnstileToken }, {
      onSuccess: (data) => {
        setChannel(data.channel);
        setStep("code");
      },
      onError: (err) => {
        setErrorMsg(getErrorMessage(err) ?? m.vote_error_generic({}, { locale }));
        turnstileRef.current?.reset();
        setTurnstileToken(null);
      },
    });
  };

  const handleVote = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    vote.mutate(
      { teamId, token: code },
      {
        onError: (err) => {
          setErrorMsg(getErrorMessage(err) ?? m.vote_error_generic({}, { locale }));
        },
      },
    );
  };

  if (step === "phone") {
    return (
      <form onSubmit={handleRequestToken} className="mt-5">
        <label className="text-sm font-medium text-black">
          {m.vote_phone_label({}, { locale })}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={m.vote_phone_placeholder({}, { locale })}
            required
            className="w-full max-w-xs rounded-xl border border-neutrals-200 px-4 py-2.5 text-sm text-black outline-none focus:border-primary-100 focus:ring-1 focus:ring-primary-100"
          />
          <button
            type="submit"
            disabled={requestToken.isPending || phone.length < 6 || !turnstileToken}
            className="shrink-0 rounded-xl bg-primary-100 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-200 disabled:opacity-50"
          >
            {requestToken.isPending
              ? m.vote_sending({}, { locale })
              : m.vote_phone_submit({}, { locale })}
          </button>
        </div>
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <div className={turnstileToken ? "sr-only" : "mt-3"} aria-hidden={!!turnstileToken}>
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken(null)}
              options={{ theme: "light", size: "normal" }}
            />
          </div>
        )}
        {errorMsg && (
          <p className="mt-2 text-sm text-rose-600">{errorMsg}</p>
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleVote} className="mt-5">
      <p className="text-sm font-medium text-black">
        {channel === "email"
          ? m.vote_code_sent_email({}, { locale })
          : m.vote_code_sent_whatsapp({}, { locale })}
      </p>
      <label className="mt-3 text-sm text-neutrals-600">
        {m.vote_code_label({}, { locale })}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder={m.vote_code_placeholder({}, { locale })}
          required
          className="w-32 rounded-xl border border-neutrals-200 px-4 py-2.5 text-center text-lg font-semibold tracking-[0.3em] text-black outline-none tabular-nums focus:border-primary-100 focus:ring-1 focus:ring-primary-100"
        />
        <button
          type="submit"
          disabled={vote.isPending || code.length !== 6}
          className="shrink-0 rounded-xl bg-primary-100 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-200 disabled:opacity-50"
        >
          {vote.isPending
            ? m.vote_sending({}, { locale })
            : m.vote_code_submit({}, { locale })}
        </button>
      </div>
      {errorMsg && (
        <p className="mt-2 text-sm text-rose-600">{errorMsg}</p>
      )}
      <button
        type="button"
        onClick={() => { setStep("phone"); setCode(""); setErrorMsg(null); }}
        className="mt-3 text-xs text-primary-100 hover:text-primary-200"
      >
        ← {m.vote_phone_submit({}, { locale })}
      </button>
    </form>
  );
}

function VideoSection({
  videoUrl,
  secondaryVideoUrl,
  locale,
}: {
  videoUrl: string | null;
  secondaryVideoUrl: string | null;
  locale: Locale;
}) {
  const primaryId = videoUrl ? extractVideoId(videoUrl) : null;
  const secondaryId = secondaryVideoUrl ? extractVideoId(secondaryVideoUrl) : null;
  const hasBoth = !!primaryId && !!secondaryId;
  const [active, setActive] = useState<"primary" | "secondary">("primary");

  if (!primaryId && !secondaryId) return null;

  const activeId = active === "primary" ? primaryId : secondaryId;
  if (!activeId) return null;

  return (
    <div className="mt-10">
      {hasBoth && (
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setActive("primary")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active === "primary"
                ? "bg-primary-100 text-white"
                : "bg-neutrals-100 text-neutrals-500 ring-1 ring-black/5 hover:bg-neutrals-200"
            }`}
          >
            {m.solution_pitch({}, { locale })}
          </button>
          <button
            type="button"
            onClick={() => setActive("secondary")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active === "secondary"
                ? "bg-primary-100 text-white"
                : "bg-neutrals-100 text-neutrals-500 ring-1 ring-black/5 hover:bg-neutrals-200"
            }`}
          >
            {m.solution_pitch_en({}, { locale })}
          </button>
        </div>
      )}
      <div className="overflow-hidden rounded-2xl">
        <YouTubeEmbed videoid={activeId} params="rel=0" />
      </div>
    </div>
  );
}
