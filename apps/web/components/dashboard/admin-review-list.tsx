"use client";

import { useState } from "react";
import { CheckIcon, XIcon, UsersIcon, VideoIcon, EyeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useTeamsInReview,
  useApproveTeam,
  useRejectTeam,
} from "@/hooks/use-admin-teams";
import { TeamStatusBadge } from "./team-status-badge";
import { TeamSitePreview } from "./team-site-preview";
import type { Team } from "@/lib/api/types";

const PILLAR_LABELS: Record<string, string> = {
  digital_agriculture: "Agricultura Digital",
  bioeconomy: "Bioeconomia",
  logistics: "Logística",
  education: "Educação comunitária",
  health: "Saúde e segurança sanitária",
  verticalization: "Verticalização",
  governance_financial_sustainability: "Governança e sustentabilidade financeira",
  default: "Outro",
};

function RejectDialog({
  team,
  onConfirm,
  onCancel,
  loading,
}: {
  team: Team;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/50 p-4">
      <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
        <h3 className="text-base font-semibold text-neutral-900">
          Rejeitar equipe
        </h3>
        <p className="mt-1 text-sm text-neutral-500">
          Informe o motivo da rejeição para a equipe{" "}
          <strong>{team.name}</strong>. O líder receberá um e-mail com este
          motivo.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          className="mt-4 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
          placeholder="Ex: A logo não atende aos requisitos mínimos..."
          aria-label="Motivo da rejeição"
        />
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!reason.trim() || loading}
            onClick={() => onConfirm(reason.trim())}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Confirmar rejeição"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamPreviewCard({
  team,
  onApprove,
  onReject,
  onPreview,
  approving,
}: {
  team: Team;
  onApprove: () => void;
  onReject: () => void;
  onPreview: () => void;
  approving: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      {/* Header */}
      <div className="border-b border-neutral-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {team.logoUrl ? (
              <img
                src={team.logoUrl}
                alt={`Logo ${team.name}`}
                className="size-10 rounded-full border border-neutral-200 object-cover"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-sm font-semibold text-neutral-400">
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-900">
                  {team.name}
                </h3>
                <TeamStatusBadge status={team.status} />
              </div>
              <p className="text-xs text-neutral-500">
                {PILLAR_LABELS[team.solutionPillar] ?? team.solutionPillar} · /
                {team.slug}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onPreview}
            >
              <EyeIcon />
              Ver preview
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReject}
            >
              <XIcon />
              Rejeitar
            </Button>
            <Button
              type="button"
              size="sm"
              loading={approving}
              onClick={onApprove}
            >
              <CheckIcon />
              Aprovar
            </Button>
          </div>
        </div>
      </div>

      {/* Preview do conteúdo */}
      <div className="px-6 py-4">
        {team.description && (
          <p className="text-sm text-neutral-700 text-pretty whitespace-pre-line">
            {team.description}
          </p>
        )}

        {team.videoUrl && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500">
            <VideoIcon className="size-3.5 shrink-0 stroke-neutral-400" />
            <a
              href={team.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-primary-100 hover:underline"
            >
              {team.videoUrl}
            </a>
          </div>
        )}

        {team.teamMembers && team.teamMembers.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
              <UsersIcon className="size-3.5 shrink-0 stroke-neutral-400" />
              {team.teamMembers.length} membro
              {team.teamMembers.length > 1 ? "s" : ""}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {team.teamMembers.map((member, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-1.5"
                >
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary-100/10 text-xs font-medium text-primary-100">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-900">
                      {member.name}
                    </p>
                    <p className="text-xs text-neutral-500">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export function AdminReviewList() {
  const { data: teams, isLoading } = useTeamsInReview();
  const approveMutation = useApproveTeam();
  const rejectMutation = useRejectTeam();
  const [rejectingTeam, setRejectingTeam] = useState<Team | null>(null);
  const [previewTeam, setPreviewTeam] = useState<Team | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />
        <div className="h-48 animate-pulse rounded-xl bg-neutral-200" />
        <div className="h-48 animate-pulse rounded-xl bg-neutral-200" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Equipes em revisão
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Revise as equipes e aprove ou rejeite com feedback.
      </p>

      {!teams || teams.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white py-12">
          <p className="text-sm text-neutral-500">
            Nenhuma equipe pendente de revisão.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {teams.map((team) => (
            <TeamPreviewCard
              key={team.id}
              team={team}
              approving={approveMutation.isPending}
              onApprove={() => approveMutation.mutate(team.id)}
              onReject={() => setRejectingTeam(team)}
              onPreview={() => setPreviewTeam(team)}
            />
          ))}
        </div>
      )}

      {rejectingTeam && (
        <RejectDialog
          team={rejectingTeam}
          loading={rejectMutation.isPending}
          onCancel={() => setRejectingTeam(null)}
          onConfirm={(reason) =>
            rejectMutation.mutate(
              { id: rejectingTeam.id, reason },
              { onSuccess: () => setRejectingTeam(null) },
            )
          }
        />
      )}

      {previewTeam && (
        <TeamSitePreview
          team={previewTeam}
          onClose={() => setPreviewTeam(null)}
        />
      )}
    </div>
  );
}
