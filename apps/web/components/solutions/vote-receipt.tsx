"use client";

import { motion } from "motion/react";
import { CheckCircle2Icon } from "lucide-react";
import type { Locale } from "@/lib/paraglide/runtime";
import { ShareSolution } from "./share-solution";

const LABELS = {
  "pt-br": {
    badge: "Voto confirmado",
    title: (team: string) => `Apoiei a solução ${team}! 🎉`,
    subtitle: "Convide mais gente pra votar — cada voto que seu link trouxer conta pra você no pódio.",
    shareMessage: (team: string) => `Apoiei a solução ${team} no Amazon Hacking! Vem votar também:`,
  },
  en: {
    badge: "Vote confirmed",
    title: (team: string) => `I backed ${team}! 🎉`,
    subtitle: "Invite more people to vote — every vote your link brings counts toward you on the podium.",
    shareMessage: (team: string) => `I backed ${team} at Amazon Hacking! Come vote too:`,
  },
  es: {
    badge: "Voto confirmado",
    title: (team: string) => `¡Apoyé la solución ${team}! 🎉`,
    subtitle: "Invita a más gente a votar — cada voto que traiga tu enlace cuenta para ti en el podio.",
    shareMessage: (team: string) => `¡Apoyé la solución ${team} en Amazon Hacking! Ven a votar también:`,
  },
};

export function VoteReceipt({
  teamId,
  teamName,
  slug,
  voterId,
  locale,
}: {
  teamId: string;
  teamName: string;
  slug: string;
  voterId?: string;
  locale: Locale;
}) {
  const labels = LABELS[locale];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mt-5 overflow-hidden rounded-2xl border border-secondary-100/30 bg-gradient-to-br from-secondary-100/10 to-primary-100/5 p-5 sm:p-6"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-white">
        <CheckCircle2Icon className="size-3.5" />
        {labels.badge}
      </span>
      <h3 className="mt-3 text-xl font-semibold tracking-tight text-black text-balance">
        {labels.title(teamName)}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-neutrals-600 text-pretty">{labels.subtitle}</p>

      <div className="mt-1">
        <ShareSolution
          slug={slug}
          teamId={teamId}
          teamName={teamName}
          voterId={voterId}
          locale={locale}
          defaultOpen
          message={labels.shareMessage(teamName)}
        />
      </div>
    </motion.div>
  );
}
