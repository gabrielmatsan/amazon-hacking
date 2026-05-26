"use client";

import { useState } from "react";
import {
  CheckIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import {
  useFlaggedVotes,
  useApproveVote,
  useInvalidateVote,
} from "@/hooks/use-admin-teams";
import type { FlaggedVote } from "@/lib/api/admin";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractFlagReasons(metadata: Record<string, unknown> | null): string[] {
  if (!metadata) return [];
  const proxyCheck = metadata.proxyCheck as Record<string, unknown> | undefined;
  if (!proxyCheck) return [];

  const detections = proxyCheck.detections as Record<string, unknown> | undefined;
  if (!detections) return [];

  const reasons: string[] = [];
  if (detections.vpn) reasons.push("VPN");
  if (detections.proxy) reasons.push("Proxy");
  if (detections.tor) reasons.push("Tor");
  if (detections.hosting) reasons.push("Hosting");
  if (detections.compromised) reasons.push("IP comprometido");
  if (typeof detections.risk === "number" && detections.risk >= 33) {
    reasons.push(`Risco: ${detections.risk}%`);
  }
  return reasons;
}

const FLAG_TOOLTIPS: Record<string, string> = {
  VPN: "IP pertencente a um serviço de VPN, que mascara a localização real do usuário.",
  Proxy: "IP associado a um servidor proxy, usado para intermediar conexões e ocultar a origem.",
  Tor: "IP é um nó de saída da rede Tor, usada para navegação anônima.",
  Hosting: "IP pertence a um provedor de hosting/datacenter — pode indicar bot ou automação.",
  "IP comprometido": "IP reportado em listas de endereços comprometidos ou envolvidos em atividade maliciosa.",
};

function FlagReasons({ metadata }: { metadata: Record<string, unknown> | null }) {
  const reasons = extractFlagReasons(metadata);
  if (reasons.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 border-t border-neutral-950/5 px-4 py-2.5">
      <span className="text-xs text-neutral-500">Motivo:</span>
      {reasons.map((reason) => {
        const isRisk = reason.startsWith("Risco:");
        const tooltip = isRisk
          ? "Score de risco do IP ultrapassou o limite de 33%. Quanto maior, mais provável a fraude."
          : FLAG_TOOLTIPS[reason];
        return (
          <span key={reason} className="group relative inline-flex cursor-help">
            <span className="inline-flex rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/10">
              {reason}
            </span>
            {tooltip && (
              <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 hidden w-56 -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-xs text-neutral-200 shadow-lg group-hover:block">
                {tooltip}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function GlossaryItem({ term, description }: { term: string; description: string }) {
  return (
    <div className="flex gap-3 px-4 py-2.5">
      <dt className="w-28 shrink-0">
        <span className="inline-flex rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-600/10">
          {term}
        </span>
      </dt>
      <dd className="text-xs text-neutral-600">{description}</dd>
    </div>
  );
}

function MetadataSection({ metadata }: { metadata: Record<string, unknown> | null }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <p className="text-xs text-neutral-400">Sem metadata</p>;
  }

  return (
    <pre className="max-h-48 overflow-auto rounded-lg bg-neutral-900 p-3 text-xs text-neutral-300">
      {JSON.stringify(metadata, null, 2)}
    </pre>
  );
}

function VoteCard({
  vote,
  onApprove,
  onInvalidate,
  approving,
  invalidating,
}: {
  vote: FlaggedVote;
  onApprove: () => void;
  onInvalidate: () => void;
  approving: boolean;
  invalidating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-amber-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
            {vote.userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-neutral-900">
              {vote.userName}
            </p>
            <p className="truncate text-xs text-neutral-500">
              {vote.userEmail} · {vote.teamName}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={invalidating}
            onClick={onInvalidate}
            className="flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            <XIcon className="size-3.5 shrink-0" />
            Invalidar
          </button>
          <button
            type="button"
            disabled={approving}
            onClick={onApprove}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <CheckIcon className="size-3.5 shrink-0" />
            Aprovar
          </button>
        </div>
      </div>

      <FlagReasons metadata={vote.metadata} />

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-px border-t border-neutral-950/5 bg-neutral-950/5 sm:grid-cols-4">
        <InfoCell label="IP" value={vote.ipAddress ?? "—"} />
        <InfoCell label="País" value={vote.ipCountry ?? "—"} />
        <InfoCell label="Canal" value={vote.channel === "whatsapp" ? "WhatsApp" : "E-mail"} />
        <InfoCell label="Data" value={formatDate(vote.createdAt)} />
      </div>
      <div className="grid grid-cols-2 gap-px border-t border-neutral-950/5 bg-neutral-950/5 sm:grid-cols-3">
        <InfoCell label="Telefone" value={vote.phoneNumber ?? "—"} />
        <InfoCell label="Fingerprint" value={vote.fingerprint ?? "—"} mono />
        <InfoCell label="User Agent" value={vote.userAgent ?? "—"} truncated className="col-span-2 sm:col-span-1" />
      </div>

      {/* Expandable metadata */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-center gap-1 border-t border-neutral-950/5 px-4 py-2 text-xs text-neutral-500 hover:bg-neutral-50"
      >
        {expanded ? (
          <>
            Esconder metadata <ChevronUpIcon className="size-3.5 shrink-0" />
          </>
        ) : (
          <>
            Ver metadata <ChevronDownIcon className="size-3.5 shrink-0" />
          </>
        )}
      </button>
      {expanded && (
        <div className="border-t border-neutral-950/5 px-4 py-3">
          <MetadataSection metadata={vote.metadata} />
        </div>
      )}
    </div>
  );
}

function InfoCell({
  label,
  value,
  mono,
  truncated,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncated?: boolean;
  className?: string;
}) {
  return (
    <div className={`bg-white px-4 py-2.5 ${className ?? ""}`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p
        className={`mt-0.5 text-sm text-neutral-900 ${mono ? "font-mono text-xs" : ""} ${truncated ? "truncate" : ""}`}
        title={truncated ? value : undefined}
      >
        {value}
      </p>
    </div>

    
  );
}

export function AdminFlaggedVotes() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useFlaggedVotes();
  const approveMutation = useApproveVote();
  const invalidateMutation = useInvalidateVote();

  const votes = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-neutral-200" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Votos flagged
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Revise votos suspeitos. Veja IP, metadata e decida aprovar ou invalidar.
      </p>

      {/* Glossário */}
      <details className="mt-6 rounded-xl border border-neutral-200 bg-white">
        <summary className="cursor-pointer select-none px-4 py-3 text-xs font-medium text-neutral-500">
          Glossário de termos de risco
        </summary>
        <dl className="divide-y divide-neutral-950/5 border-t border-neutral-950/5">
          <GlossaryItem term="VPN" description="IP pertencente a um serviço de VPN, que mascara a localização real do usuário." />
          <GlossaryItem term="Proxy" description="IP associado a um servidor proxy, usado para intermediar conexões e ocultar a origem." />
          <GlossaryItem term="Tor" description="IP é um nó de saída da rede Tor, usada para navegação anônima." />
          <GlossaryItem term="Hosting" description="IP pertence a um provedor de hosting/datacenter, não a um usuário residencial — pode indicar bot ou automação." />
          <GlossaryItem term="IP comprometido" description="IP reportado em listas de endereços comprometidos ou envolvidos em atividade maliciosa." />
          <GlossaryItem term="Risco ≥ 33%" description="Score de risco do IP ultrapassou o limite. Quanto maior, mais provável a fraude." />
        </dl>
      </details>

      {votes.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white py-12">
          <p className="text-sm text-neutral-500">
            Nenhum voto flagged pendente.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {votes.map((vote) => (
            <VoteCard
              key={vote.id}
              vote={vote}
              approving={approveMutation.isPending}
              onApprove={() => approveMutation.mutate(vote.id)}
              invalidating={invalidateMutation.isPending}
              onInvalidate={() => invalidateMutation.mutate(vote.id)}
            />
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {isFetchingNextPage ? "Carregando..." : "Carregar mais"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
