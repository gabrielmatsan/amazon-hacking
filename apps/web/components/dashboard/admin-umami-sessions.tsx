"use client";

import { useState } from "react";
import { useUmamiSessions, useUmamiSession } from "@/hooks/use-admin-teams";
import type { UmamiRange } from "@/lib/api/admin";

function formatDateTime(iso: string): string {
  if (!iso) return "—";
  const date = new Date(iso.includes("T") ? iso : iso.replace(" ", "T"));
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Belem",
  });
}

function SessionDetail({ sessionId, range }: { sessionId: string; range: UmamiRange }) {
  const { data, isLoading, isError } = useUmamiSession(sessionId, range);

  if (isLoading) return <p className="px-4 py-4 text-xs text-neutral-400">Carregando jornada…</p>;
  if (isError || !data) return <p className="px-4 py-4 text-xs text-amber-700">Não foi possível carregar a sessão.</p>;

  return (
    <div className="space-y-4 border-t border-neutral-100 bg-neutral-50/60 px-4 py-4">
      {data.session.distinctId ? (
        <p className="text-xs text-neutral-600">
          <span className="font-medium text-neutral-500">Distinct ID:</span>{" "}
          <span className="font-mono text-neutral-900">{data.session.distinctId}</span>
        </p>
      ) : (
        <p className="text-xs text-neutral-400">Sessão anônima (sem Distinct ID).</p>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold text-neutral-700">Jornada</p>
        {data.activity.length === 0 ? (
          <p className="text-xs text-neutral-400">Sem atividade no período.</p>
        ) : (
          <ol className="space-y-1.5">
            {data.activity.map((step, i) => (
              <li key={`${step.createdAt}-${i}`} className="flex items-center gap-2 text-xs">
                <span className="w-10 shrink-0 tabular-nums text-neutral-400">{formatDateTime(step.createdAt).split(" ")[1]}</span>
                {step.eventType === 2 ? (
                  <span className="rounded bg-secondary-100/10 px-1.5 py-0.5 font-medium text-secondary-100">
                    ⚡ {step.eventName || "evento"}
                  </span>
                ) : (
                  <span className="truncate text-neutral-700">{step.urlPath || "/"}</span>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>

      {data.properties.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold text-neutral-700">Propriedades</p>
          <ul className="space-y-1">
            {data.properties.map((p) => (
              <li key={p.key} className="text-xs text-neutral-600">
                <span className="text-neutral-400">{p.key}:</span>{" "}
                <span className="font-medium text-neutral-900">{p.value}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export function UmamiSessions({ range }: { range: UmamiRange }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useUmamiSessions(range, page, search);

  const totalPages = data ? Math.max(1, Math.ceil(data.count / 20)) : 1;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-neutral-900">Sessões</h2>
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Buscar (Distinct ID, cidade…)"
          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 outline-none focus:border-primary-100"
        />
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {isLoading ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-400">Carregando…</p>
        ) : !data || data.items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-neutral-500">Sem sessões no período.</p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {data.items.map((session) => {
              const expanded = expandedId === session.id;
              return (
                <li key={session.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : session.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50"
                  >
                    <span className="flex-1 truncate text-sm text-neutral-700">
                      {[session.city, session.country].filter(Boolean).join(", ") || "—"} ·{" "}
                      <span className="text-neutral-500">{session.browser} / {session.os} / {session.device}</span>
                    </span>
                    <span className="shrink-0 text-xs tabular-nums text-neutral-400">{session.views} views</span>
                    <span className="hidden shrink-0 text-xs tabular-nums text-neutral-400 sm:inline">
                      {formatDateTime(session.lastAt)}
                    </span>
                  </button>
                  {expanded ? <SessionDetail sessionId={session.id} range={range} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {data && data.count > 20 ? (
        <div className="mt-3 flex items-center justify-between text-xs text-neutral-500">
          <span>
            Página {page} de {totalPages} · {data.count} sessões
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-neutral-200 px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-neutral-200 px-3 py-1 font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
