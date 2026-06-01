"use client";

import { useVisitorsAnalytics } from "@/hooks/use-admin-teams";

function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}

function formatDay(iso: string): string {
  // iso is "YYYY-MM-DD" — parse as UTC to avoid timezone drift.
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

export function AdminVisitors() {
  const { data, isLoading, isError } = useVisitorsAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-neutral-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="h-28 animate-pulse rounded-xl bg-neutral-200" />
          <div className="h-28 animate-pulse rounded-xl bg-neutral-200" />
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
          Visitantes únicos
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Dados de tráfego da Cloudflare.
        </p>
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-800">
          Não foi possível carregar os dados da Cloudflare. Verifique se as
          variáveis <code className="font-mono">CLOUDFLARE_API_TOKEN</code> e{" "}
          <code className="font-mono">CLOUDFLARE_ZONE_ID</code> estão
          configuradas no servidor e se o domínio está atrás da Cloudflare.
        </div>
      </div>
    );
  }

  const { uniqueVisitors, totalRequests, range, series } = data;
  const maxUniques = Math.max(1, ...series.map((d) => d.uniques));

  return (
    <div>
      <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
        Visitantes únicos
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Últimos {range.days} dias · {formatDay(range.since)} a{" "}
        {formatDay(range.until)} · fonte: Cloudflare.
      </p>
      <p className="mt-0.5 text-xs text-neutral-400">
        Dias contados em UTC (meia-noite UTC = 21h em Belém).
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-950/10 bg-white px-4 py-5">
          <p className="truncate text-xs font-medium text-neutral-500">
            Visitantes únicos
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-900">
            {formatNumber(uniqueVisitors)}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Soma dos únicos diários no período.
          </p>
        </div>
        <div className="rounded-xl border border-neutral-950/10 bg-white px-4 py-5">
          <p className="truncate text-xs font-medium text-neutral-500">
            Requisições
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-neutral-900">
            {formatNumber(totalRequests)}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Total de requisições no período.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-900">
          Visitantes únicos por dia <span className="font-normal text-neutral-400">(UTC)</span>
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {series.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">
              Sem dados no período.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {series.map((day) => (
                <li
                  key={day.date}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <span className="w-12 shrink-0 text-xs tabular-nums text-neutral-500">
                    {formatDay(day.date)}
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-primary-100"
                      style={{
                        width: `${(day.uniques / maxUniques) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right text-sm font-medium tabular-nums text-neutral-900">
                    {formatNumber(day.uniques)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
