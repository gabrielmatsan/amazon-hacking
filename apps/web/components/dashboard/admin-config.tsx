"use client";

import { useEffect, useState } from "react";
import { useAppConfig, useUpdateAppConfig } from "@/hooks/use-admin-teams";

function toLocalDatetime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDatetime(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}

export function AdminConfig() {
  const { data: config, isLoading } = useAppConfig();
  const updateMutation = useUpdateAppConfig();

  const [votingEnabled, setVotingEnabled] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [maxRiskScore, setMaxRiskScore] = useState(100);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setVotingEnabled(config.votingEnabled);
      setStartsAt(toLocalDatetime(config.votingStartsAt));
      setEndsAt(toLocalDatetime(config.votingEndsAt));
      setMaxRiskScore(config.maxRiskScore);
    }
  }, [config]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    updateMutation.mutate(
      {
        votingStartsAt: fromLocalDatetime(startsAt),
        votingEndsAt: fromLocalDatetime(endsAt),
        votingEnabled,
        maxRiskScore,
      },
      { onSuccess: () => setSaved(true) },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />
        <div className="h-48 animate-pulse rounded-xl bg-neutral-200" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Configurações
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Gerencie o período de votação.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-neutral-900">
          Período de votação
        </h2>

        {/* Toggle */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Votação habilitada
            </p>
            <p className="text-xs text-neutral-500">
              Desabilitar impede qualquer voto, independente do horário.
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer">
            <input
              type="checkbox"
              checked={votingEnabled}
              onChange={(e) => setVotingEnabled(e.target.checked)}
              className="peer sr-only"
            />
            <div className="h-6 w-11 rounded-full bg-neutral-200 after:absolute after:left-[2px] after:top-[2px] after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-primary-100 peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-100" />
          </label>
        </div>

        {/* Date inputs */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="voting-start" className="text-sm font-medium text-neutral-900">
              Início
            </label>
            <input
              id="voting-start"
              name="votingStartsAt"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Deixe vazio para sem limite de início.
            </p>
          </div>
          <div>
            <label htmlFor="voting-end" className="text-sm font-medium text-neutral-900">
              Fim
            </label>
            <input
              id="voting-end"
              name="votingEndsAt"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Deixe vazio para sem limite de término.
            </p>
          </div>
        </div>

        {/* Limite de risco */}
        <div className="mt-6">
          <label htmlFor="max-risk" className="text-sm font-medium text-neutral-900">
            Limite máximo de risco (%)
          </label>
          <p className="mt-0.5 text-xs text-neutral-500">
            Votos com score de risco acima deste valor serão bloqueados. Votos com risco ≥ 33% continuam sendo marcados como flagged para revisão manual.
          </p>
          <div className="mt-2 flex items-center gap-3">
            <input
              id="max-risk"
              name="maxRiskScore"
              type="range"
              min={0}
              max={100}
              step={1}
              value={maxRiskScore}
              onChange={(e) => setMaxRiskScore(Number(e.target.value))}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-200 accent-primary-100"
            />
            <span className="w-12 text-right text-sm font-semibold text-neutral-900 tabular-nums">
              {maxRiskScore}%
            </span>
          </div>
        </div>

        {/* Status */}
        {config && (
          <div className="mt-6 rounded-lg bg-neutral-50 px-4 py-3">
            <p className="text-xs text-neutral-500">
              Status atual:{" "}
              {!config.votingEnabled ? (
                <span className="font-medium text-red-600">Desabilitada</span>
              ) : config.votingStartsAt && new Date() < new Date(config.votingStartsAt) ? (
                <span className="font-medium text-amber-600">Aguardando início</span>
              ) : config.votingEndsAt && new Date() > new Date(config.votingEndsAt) ? (
                <span className="font-medium text-red-600">Encerrada</span>
              ) : (
                <span className="font-medium text-emerald-600">Aberta</span>
              )}
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center gap-3 border-t border-neutral-200 pt-6">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="rounded-lg bg-primary-100 px-4 py-2 text-sm font-medium text-white hover:bg-primary-200 disabled:opacity-50"
          >
            {updateMutation.isPending ? "Salvando..." : "Salvar"}
          </button>
          {saved && (
            <p className="text-sm text-emerald-600">Configurações salvas.</p>
          )}
        </div>
      </form>
    </div>
  );
}
