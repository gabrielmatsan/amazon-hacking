"use client";

import { useState } from "react";
import { TrophyIcon, CheckIcon, CopyIcon } from "lucide-react";
import type { Locale } from "@/lib/paraglide/runtime";
import { SITE_URL } from "@/lib/site";
import { useAuth } from "@/hooks/use-auth";
import { useTorcida } from "@/hooks/use-votes";
import { trackEvent } from "@/lib/analytics/umami";

const MEDALS = ["🥇", "🥈", "🥉"];

const LABELS = {
  "pt-br": {
    title: "Minha torcida",
    subtitle: "Compartilhe seu link e dispute o pódio de quem mais mobiliza votos.",
    yourLink: "Seu link de torcida",
    copy: "Copiar",
    copied: "Copiado!",
    empty: "Ainda não há ranking. Seja o primeiro a mobilizar!",
    youAre: "Você está em",
    place: "º lugar",
    climb: "Compartilhe para subir ao pódio!",
    loginHint: "Entre para ter seu link e disputar o pódio.",
  },
  en: {
    title: "My supporters",
    subtitle: "Share your link and compete for the podium of who mobilizes the most votes.",
    yourLink: "Your supporter link",
    copy: "Copy",
    copied: "Copied!",
    empty: "No ranking yet. Be the first to mobilize!",
    youAre: "You're in",
    place: "place",
    climb: "Share to climb the podium!",
    loginHint: "Sign in to get your link and join the podium.",
  },
  es: {
    title: "Mi hinchada",
    subtitle: "Comparte tu enlace y compite por el podio de quien moviliza más votos.",
    yourLink: "Tu enlace de hinchada",
    copy: "Copiar",
    copied: "¡Copiado!",
    empty: "Aún no hay ranking. ¡Sé el primero en movilizar!",
    youAre: "Estás en",
    place: "º lugar",
    climb: "¡Comparte para subir al podio!",
    loginHint: "Inicia sesión para tener tu enlace y competir.",
  },
};

export function MinhaTorcida({ locale }: { locale: Locale }) {
  const { data: user } = useAuth();
  const { data, isLoading } = useTorcida();
  const [copied, setCopied] = useState(false);
  const labels = LABELS[locale];

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-2xl bg-neutrals-100" />;
  }

  const link = user ? `${SITE_URL}/solucoes?ref=${user.id}` : null;

  const fireShare = (method: string) => trackEvent("torcida-shared", { method });

  const copy = async () => {
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
    <div className="rounded-2xl border border-primary-100/20 bg-primary-100/[0.03] p-5 sm:p-6">
      <div className="flex items-center gap-2 text-primary-100">
        <TrophyIcon className="size-5" />
        <h2 className="text-lg font-semibold">{labels.title}</h2>
      </div>
      <p className="mt-1 text-sm text-neutrals-500">{labels.subtitle}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => {
          const entry = podium[i];
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                entry ? "border-neutrals-200 bg-white" : "border-dashed border-neutrals-200 bg-transparent"
              }`}
            >
              <span className="text-2xl">{MEDALS[i]}</span>
              <span className={`truncate text-sm font-semibold ${entry ? "text-black" : "text-neutrals-300"}`}>
                {entry ? entry.name : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {podium.length === 0 ? (
        <p className="mt-3 text-xs text-neutrals-400">{labels.empty}</p>
      ) : null}

      {user ? (
        <div className="mt-5 border-t border-neutrals-200 pt-4">
          {myPosition ? (
            <p className="mb-3 text-sm font-semibold text-primary-100">
              {MEDALS[myPosition - 1]} {labels.youAre} {myPosition}
              {labels.place}!
            </p>
          ) : (
            <p className="mb-3 text-sm text-neutrals-500">{labels.climb}</p>
          )}
          <p className="text-xs font-medium text-neutrals-500">{labels.yourLink}</p>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-neutrals-200 bg-white px-3 py-2">
            <span className="flex-1 truncate font-mono text-xs text-neutrals-600">{link}</span>
            <button
              type="button"
              onClick={copy}
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
        <p className="mt-4 border-t border-neutrals-200 pt-4 text-xs text-neutrals-400">{labels.loginHint}</p>
      )}
    </div>
  );
}
