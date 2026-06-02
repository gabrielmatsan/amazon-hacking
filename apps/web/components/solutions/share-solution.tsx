"use client";

import { useState } from "react";
import { ShareIcon, CheckIcon, CopyIcon, SlidersHorizontalIcon } from "lucide-react";
import type { Locale } from "@/lib/paraglide/runtime";
import { SITE_URL } from "@/lib/site";
import { trackEvent } from "@/lib/analytics/umami";

const DEFAULT_UTM = { source: "compartilhamento", medium: "referral", campaign: "solucoes-2026" };

type ShareSolutionProps = {
  slug: string;
  teamId: string;
  teamName: string;
  locale: Locale;
  voterId?: string;
};

export function ShareSolution({ slug, teamId, teamName, locale, voterId }: ShareSolutionProps) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  // Default ON for logged-in users: mark the link as the sharer's so the votes it
  // brings credit them on the supporter leaderboard. Uses the opaque user id (no PII).
  const [markAsMe, setMarkAsMe] = useState(true);
  const [utm, setUtm] = useState({ ...DEFAULT_UTM, content: "" });
  const [copied, setCopied] = useState(false);

  const basePath = `${locale === "pt-br" ? "" : `/${locale}`}/solucoes/${slug}`;

  const params = new URLSearchParams();
  params.set("utm_source", (custom ? utm.source : DEFAULT_UTM.source).trim() || "compartilhamento");
  params.set("utm_medium", (custom ? utm.medium : DEFAULT_UTM.medium).trim() || "referral");
  params.set("utm_campaign", (custom ? utm.campaign : DEFAULT_UTM.campaign).trim() || "solucoes-2026");
  const content = custom ? utm.content.trim() : "";
  if (content) params.set("utm_content", content);
  if (markAsMe && voterId) params.set("ref", voterId);

  const url = `${SITE_URL}${basePath}?${params.toString()}`;

  const fireShare = (method: string) =>
    trackEvent("solution-shared", {
      teamId,
      method,
      utm_source: params.get("utm_source") ?? "",
      utm_campaign: params.get("utm_campaign") ?? "",
      markAsMe: markAsMe && !!voterId,
    });

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    fireShare("copy");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    fireShare("whatsapp");
    window.open(`https://wa.me/?text=${encodeURIComponent(`${teamName} — ${url}`)}`, "_blank", "noopener");
  };

  const shareNative = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      fireShare("native");
      await navigator.share({ title: teamName, url }).catch(() => undefined);
    }
  };

  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;
  const labels = {
    "pt-br": { share: "Compartilhar", customize: "Personalizar UTM", identity: "Marcar como minha indicação", identityHint: "Os votos deste link contam para você no pódio.", copy: "Copiar link", copied: "Copiado!" },
    en: { share: "Share", customize: "Customize UTM", identity: "Mark as my referral", identityHint: "Votes from this link count toward you on the podium.", copy: "Copy link", copied: "Copied!" },
    es: { share: "Compartir", customize: "Personalizar UTM", identity: "Marcar como mi referido", identityHint: "Los votos de este enlace cuentan para ti en el podio.", copy: "Copiar enlace", copied: "¡Copiado!" },
  }[locale];

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-primary-100/30 px-4 py-2 text-sm font-semibold text-primary-100 transition hover:bg-primary-100/5"
      >
        <ShareIcon className="size-4" />
        {labels.share}
      </button>

      {open ? (
        <div className="mt-3 max-w-md rounded-2xl border border-neutrals-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 rounded-xl border border-neutrals-200 bg-neutrals-100/60 px-3 py-2">
            <span className="flex-1 truncate font-mono text-xs text-neutrals-600">{url}</span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary-100 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-primary-200"
            >
              {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
              {copied ? labels.copied : labels.copy}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
            >
              WhatsApp
            </button>
            {canNativeShare ? (
              <button
                type="button"
                onClick={shareNative}
                className="rounded-lg border border-neutrals-200 px-3 py-1.5 text-xs font-semibold text-neutrals-700 hover:bg-neutrals-100"
              >
                {labels.share}…
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setCustom((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                custom ? "border-primary-100 text-primary-100" : "border-neutrals-200 text-neutrals-700 hover:bg-neutrals-100"
              }`}
            >
              <SlidersHorizontalIcon className="size-3.5" />
              {labels.customize}
            </button>
          </div>

          {custom ? (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(["source", "medium", "campaign", "content"] as const).map((field) => (
                <label key={field} className="text-[11px] font-medium text-neutrals-500">
                  utm_{field}
                  <input
                    type="text"
                    value={utm[field]}
                    onChange={(e) => setUtm((prev) => ({ ...prev, [field]: e.target.value }))}
                    placeholder={field === "content" ? "—" : DEFAULT_UTM[field as keyof typeof DEFAULT_UTM]}
                    className="mt-0.5 w-full rounded-lg border border-neutrals-200 px-2.5 py-1.5 text-xs text-neutrals-800 outline-none focus:border-primary-100"
                  />
                </label>
              ))}
            </div>
          ) : null}

          {voterId ? (
            <label className="mt-3 flex items-start gap-2 text-xs text-neutrals-600">
              <input
                type="checkbox"
                checked={markAsMe}
                onChange={(e) => setMarkAsMe(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                {labels.identity}
                <span className="block text-[11px] text-neutrals-400">{labels.identityHint}</span>
              </span>
            </label>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
