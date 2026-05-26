"use client";

import { useVotesDashboard } from "@/hooks/use-admin-teams";

const STATUS_STYLES: Record<string, string> = {
  valid: "bg-emerald-50 text-emerald-700",
  flagged: "bg-amber-50 text-amber-700",
  invalidated: "bg-red-50 text-red-700",
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  email: "E-mail",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminVotesDashboard() {
  const { data, isLoading } = useVotesDashboard();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
      </div>
    );
  }

  if (!data) return null;

  const { totals, perTeam, recent } = data;

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Votos
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Visão geral da votação.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Votos */}
        <div className="rounded-xl border border-neutral-950/10 bg-white">
          <p className="truncate border-b border-neutral-950/5 px-4 py-3 text-xs font-medium text-neutral-500">
            Votos
          </p>
          <div className="grid grid-cols-3">
            <div className="px-4 py-4">
              <p className="truncate text-xs text-neutral-500">Total</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums">{totals.total}</p>
            </div>
            <div className="border-l border-neutral-950/5 px-4 py-4">
              <p className="truncate text-xs text-neutral-500">Válidos</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700 tabular-nums">{totals.valid}</p>
            </div>
            <div className="border-l border-neutral-950/5 px-4 py-4">
              <p className="truncate text-xs text-neutral-500">Flagged</p>
              <p className="mt-1 text-2xl font-semibold text-amber-700 tabular-nums">{totals.flagged}</p>
            </div>
          </div>
        </div>

        {/* Canais */}
        <div className="rounded-xl border border-neutral-950/10 bg-white">
          <p className="truncate border-b border-neutral-950/5 px-4 py-3 text-xs font-medium text-neutral-500">
            Canais de verificação
          </p>
          <div className="grid grid-cols-2">
            <div className="px-4 py-4">
              <p className="truncate text-xs text-neutral-500">WhatsApp</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums">{totals.whatsapp}</p>
            </div>
            <div className="border-l border-neutral-950/5 px-4 py-4">
              <p className="truncate text-xs text-neutral-500">E-mail</p>
              <p className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums">{totals.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking por equipe */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-900">
          Votos por equipe
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="-mx-4 -my-2 overflow-x-auto whitespace-nowrap sm:-mx-6">
            <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-neutral-500">
                      #
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-neutral-500">
                      Equipe
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-neutral-500">
                      Válidos
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-neutral-500">
                      Flagged
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-neutral-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {perTeam.map((team, i) => (
                    <tr key={team.teamId}>
                      <td className="px-4 py-3 text-sm text-neutral-400 tabular-nums">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt=""
                              className="size-7 rounded-full border border-neutral-200 object-cover"
                            />
                          ) : (
                            <div className="flex size-7 items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-400">
                              {team.teamName.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm font-medium text-neutral-900">
                            {team.teamName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-emerald-700 tabular-nums">
                        {team.valid}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-amber-700 tabular-nums">
                        {team.flagged}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-900 tabular-nums">
                        {team.total}
                      </td>
                    </tr>
                  ))}
                  {perTeam.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">
                        Nenhum voto registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Votos recentes */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-900">
          Últimos votos
        </h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="-mx-4 -my-2 overflow-x-auto whitespace-nowrap sm:-mx-6">
            <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-6">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-neutral-500">
                      Usuário
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-neutral-500">
                      Equipe
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-neutral-500">
                      Canal
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium text-neutral-500">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-neutral-500">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {recent.map((vote) => (
                    <tr key={vote.id}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-neutral-900">
                          {vote.userName}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {vote.userEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">
                        {vote.teamName}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-700">
                        {CHANNEL_LABELS[vote.channel] ?? vote.channel}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[vote.status] ?? "bg-neutral-100 text-neutral-600"}`}
                        >
                          {vote.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-neutral-500 tabular-nums">
                        {formatDate(vote.createdAt)}
                      </td>
                    </tr>
                  ))}
                  {recent.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">
                        Nenhum voto registrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

