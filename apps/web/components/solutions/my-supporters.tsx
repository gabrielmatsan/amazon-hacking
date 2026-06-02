"use client";

import { useState } from "react";
import { TrophyIcon, CheckIcon, CopyIcon } from "lucide-react";
import type { Locale } from "@/lib/paraglide/runtime";
import { SITE_URL } from "@/lib/site";
import { useAuth } from "@/hooks/use-auth";
import { useSupportersLeaderboard } from "@/hooks/use-votes";
import { trackEvent } from "@/lib/analytics/umami";

const MEDALS = ["🥇", "🥈", "🥉"];

type Copy = {
  title: string;
  subtitle: string;
  yourLink: string;
  copy: string;
  copied: string;
  empty: string;
  rank: (position: number) => string;
  climb: string;
  loginHint: string;
};

function buildCopy(locale: Locale, project?: string): Copy {
  if (project) {
    const projectCopy: Record<Locale, Copy> = {
      "pt-br": {
        title: `Quem mais mobiliza votos para ${project}`,
        subtitle: "Compartilhe o link desta solução. Quem trouxer mais gente pra votar lidera o pódio.",
        yourLink: "Seu link para esta solução",
        copy: "Copiar",
        copied: "Copiado!",
        empty: "Ninguém mobilizou votos ainda. Seja o primeiro!",
        rank: (p) => `Você está em ${p}º lugar nesta solução!`,
        climb: "Compartilhe seu link e assuma o pódio.",
        loginHint: "Entre para gerar seu link e disputar o pódio desta solução.",
      },
      en: {
        title: `Top mobilizers for ${project}`,
        subtitle: "Share this solution's link. Whoever brings the most voters leads the podium.",
        yourLink: "Your link for this solution",
        copy: "Copy",
        copied: "Copied!",
        empty: "No one has mobilized votes yet. Be the first!",
        rank: (p) => `You're ${p}${p === 1 ? "st" : p === 2 ? "nd" : "rd"} for this solution!`,
        climb: "Share your link and take the podium.",
        loginHint: "Sign in to get your link and compete for this solution's podium.",
      },
      es: {
        title: `Quién moviliza más votos para ${project}`,
        subtitle: "Comparte el enlace de esta solución. Quien traiga más gente lidera el podio.",
        yourLink: "Tu enlace para esta solución",
        copy: "Copiar",
        copied: "¡Copiado!",
        empty: "Nadie ha movilizado votos aún. ¡Sé el primero!",
        rank: (p) => `¡Estás en ${p}º lugar en esta solución!`,
        climb: "Comparte tu enlace y toma el podio.",
        loginHint: "Inicia sesión para generar tu enlace y competir por el podio.",
      },
    };
    return projectCopy[locale];
  }

  const globalCopy: Record<Locale, Copy> = {
    "pt-br": {
      title: "Maiores mobilizadores do Amazon Hacking",
      subtitle: "Compartilhe seu link e veja quem traz mais gente para votar no evento.",
      yourLink: "Seu link do evento",
      copy: "Copiar",
      copied: "Copiado!",
      empty: "Ninguém mobilizou votos ainda. Seja o primeiro!",
      rank: (p) => `Você está em ${p}º lugar no geral!`,
      climb: "Compartilhe seu link e suba no ranking.",
      loginHint: "Entre para gerar seu link e disputar o ranking geral.",
    },
    en: {
      title: "Top mobilizers at Amazon Hacking",
      subtitle: "Share your link and see who brings the most people to vote.",
      yourLink: "Your event link",
      copy: "Copy",
      copied: "Copied!",
      empty: "No one has mobilized votes yet. Be the first!",
      rank: (p) => `You're ${p}${p === 1 ? "st" : p === 2 ? "nd" : "rd"} overall!`,
      climb: "Share your link and climb the ranking.",
      loginHint: "Sign in to get your link and join the overall ranking.",
    },
    es: {
      title: "Mayores movilizadores de Amazon Hacking",
      subtitle: "Comparte tu enlace y mira quién trae más gente a votar.",
      yourLink: "Tu enlace del evento",
      copy: "Copiar",
      copied: "¡Copiado!",
      empty: "Nadie ha movilizado votos aún. ¡Sé el primero!",
      rank: (p) => `¡Estás en ${p}º lugar general!`,
      climb: "Comparte tu enlace y sube en el ranking.",
      loginHint: "Inicia sesión para generar tu enlace y competir en el ranking.",
    },
  };
  return globalCopy[locale];
}

export function MySupporters({
  locale,
  slug,
  projectName,
}: {
  locale: Locale;
  slug?: string;
  projectName?: string;
}) {
  const { data: user } = useAuth();
  const { data, isLoading } = useSupportersLeaderboard(slug);
  const [copied, setCopied] = useState(false);
  const labels = buildCopy(locale, slug ? projectName : undefined);

  if (isLoading) {
    return <div className="h-44 animate-pulse rounded-2xl bg-white/40" />;
  }

  const localePrefix = locale === "pt-br" ? "" : `/${locale}`;
  const path = slug ? `/solucoes/${slug}` : "/solucoes";
  const link = user ? `${SITE_URL}${localePrefix}${path}?ref=${user.id}` : null;

  const fireShare = (method: string) =>
    trackEvent("supporter-link-shared", { method, scope: slug ? "project" : "global" });

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    fireShare("copy");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    if (!link) return;
    fireShare("whatsapp");
    window.open(`https://wa.me/?text=${encodeURIComponent(link)}`, "_blank", "noopener");
  };

  const podium = data?.podium ?? [];
  const myPosition = data?.myPosition ?? null;

  return (
    <div className="rounded-2xl border border-neutrals-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 text-primary-100">
        <TrophyIcon className="size-5" />
        <h2 className="text-lg font-bold text-black">{labels.title}</h2>
      </div>
      <p className="mt-1 text-sm text-neutrals-500">{labels.subtitle}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => {
          const entry = podium[i];
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
                entry ? "bg-neutrals-100/70 ring-1 ring-black/5" : "border border-dashed border-neutrals-200"
              }`}
            >
              <span className="text-2xl">{MEDALS[i]}</span>
              <span className={`truncate text-sm font-bold ${entry ? "text-black" : "text-neutrals-300"}`}>
                {entry ? entry.name : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {podium.length === 0 ? <p className="mt-3 text-xs text-neutrals-400">{labels.empty}</p> : null}

      {user ? (
        <div className="mt-5 border-t border-neutrals-200 pt-4">
          <p className="mb-3 text-sm font-semibold text-primary-100">
            {myPosition ? `${MEDALS[myPosition - 1]} ${labels.rank(myPosition)}` : labels.climb}
          </p>
          <p className="text-xs font-medium text-neutrals-500">{labels.yourLink}</p>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-neutrals-200 bg-neutrals-100/60 px-3 py-2">
            <span className="flex-1 truncate font-mono text-xs text-neutrals-600">{link}</span>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary-100 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-200"
            >
              {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
              {copied ? labels.copied : labels.copy}
            </button>
            <button
              type="button"
              onClick={shareWhatsApp}
              className="shrink-0 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              WhatsApp
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 border-t border-neutrals-200 pt-4 text-xs text-neutrals-500">{labels.loginHint}</p>
      )}
    </div>
  );
}
