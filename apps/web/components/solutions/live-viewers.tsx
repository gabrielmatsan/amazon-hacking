"use client";

import { useLiveViewers } from "@/hooks/use-teams";
import type { Locale } from "@/lib/paraglide/runtime";

const LABELS: Record<Locale, (n: string) => string> = {
  "pt-br": (n) => `${n} pessoas vendo agora`,
  en: (n) => `${n} people viewing now`,
  es: (n) => `${n} personas viendo ahora`,
};

// Min count to render — below this it doesn't read as social proof.
const MIN = 2;

export function LiveViewers({ slug, locale }: { slug: string; locale: Locale }) {
  const { data } = useLiveViewers();
  const count = data?.viewers?.[slug] ?? 0;

  if (count < MIN) return null;

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-secondary-100/30 bg-secondary-100/5 px-3 py-1.5 text-xs font-medium text-secondary-100">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-secondary-100 opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-secondary-100" />
      </span>
      {LABELS[locale](count.toLocaleString("pt-BR"))}
    </span>
  );
}
