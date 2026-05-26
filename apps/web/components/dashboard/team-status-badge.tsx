"use client";

import type { TeamStatus } from "@/lib/api/types";

const statusConfig: Record<TeamStatus, { label: string; className: string }> = {
  active: {
    label: "Ativa",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  },
  review: {
    label: "Em revisão",
    className: "bg-amber-50 text-amber-700 ring-amber-600/20",
  },
  rejected: {
    label: "Rejeitada",
    className: "bg-red-50 text-red-700 ring-red-600/20",
  },
};

export function TeamStatusBadge({ status }: { status: TeamStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.label}
    </span>
  );
}
