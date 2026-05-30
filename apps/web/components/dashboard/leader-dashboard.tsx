"use client";

import { AlertTriangleIcon } from "lucide-react";
import {
  useLeaderTeam,
  useCreateLeaderTeam,
} from "@/hooks/use-leader-team";
import { TeamForm } from "./team-form";
import { TeamStatusBadge } from "./team-status-badge";
import type { CreateLeaderTeamInput } from "@/lib/api/leader";

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

export function LeaderDashboard({ locale }: { locale: string }) {
  const { data: team, isLoading, error } = useLeaderTeam();
  const createMutation = useCreateLeaderTeam();

  const hasNoTeam = error && !isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />
        <div className="h-64 animate-pulse rounded-xl bg-neutral-200" />
      </div>
    );
  }

  if (hasNoTeam) {
    return (
      <div>
        <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
          Criar equipe
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Preencha as informações da sua equipe. Após o envio, ela será
          revisada pela organização.
        </p>
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
          <TeamForm
            onSubmit={(data: CreateLeaderTeamInput) =>
              createMutation.mutate(data)
            }
            loading={createMutation.isPending}
          />
        </div>
      </div>
    );
  }

  if (!team) return null;

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Minha Equipe
      </h1>

      {team.status === "rejected" && team.rejectionReason && (
        <div className="mt-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 stroke-red-600" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Equipe rejeitada
            </p>
            <p className="mt-1 text-sm text-red-700">
              {team.rejectionReason}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-3">
            {team.logoUrl && (
              <img
                src={team.logoUrl}
                alt={`Logo ${team.name}`}
                className="size-10 rounded-full border border-neutral-200 object-cover"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-medium text-neutral-900">
                  {team.name}
                </h2>
                <TeamStatusBadge status={team.status} />
              </div>
              {team.slug && (
                <p className="mt-1 text-sm text-neutral-500">
                  /{team.slug}
                </p>
              )}
            </div>
          </div>
        </div>

        <dl className="divide-y divide-neutral-100">
          <div className="flex gap-4 px-6 py-4">
            <dt className="w-36 shrink-0 text-sm text-neutral-500">Eixo</dt>
            <dd className="text-sm text-neutral-900">
              {PILLAR_LABELS[team.solutionPillar] ?? team.solutionPillar}
            </dd>
          </div>

          {team.description && (
            <div className="flex gap-4 px-6 py-4">
              <dt className="w-36 shrink-0 text-sm text-neutral-500">
                Descrição
              </dt>
              <dd className="text-sm text-neutral-900 text-pretty whitespace-pre-line">
                {team.description}
              </dd>
            </div>
          )}

          {team.videoUrl && (
            <div className="flex gap-4 px-6 py-4">
              <dt className="w-36 shrink-0 text-sm text-neutral-500">Vídeo</dt>
              <dd className="text-sm text-primary-100 break-all">
                <a
                  href={team.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {team.videoUrl}
                </a>
              </dd>
            </div>
          )}

          {team.teamMembers && team.teamMembers.length > 0 && (
            <div className="px-6 py-4">
              <dt className="text-sm text-neutral-500">Membros</dt>
              <dd className="mt-3">
                <ul role="list" className="divide-y divide-neutral-100">
                  {team.teamMembers.map((member, i) => (
                    <li key={i} className="flex items-center gap-3 py-2.5">
                      <div className="flex size-8 items-center justify-center rounded-full bg-primary-100/10 text-xs font-medium text-primary-100">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {member.name}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {member.role}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
