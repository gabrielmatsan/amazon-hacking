"use client";

import { Button } from "@/components/ui/button";
import { useUploadLeaderImage } from "@/hooks/use-leader-team";
import type { CreateLeaderTeamInput } from "@/lib/api/leader";
import type { SolutionPillar, Team, TeamMember } from "@/lib/api/types";
import { PlusIcon, TrashIcon, UploadIcon, XIcon } from "lucide-react";
import { useRef, useState } from "react";

const PILLAR_OPTIONS: { value: SolutionPillar; label: string }[] = [
  { value: "digital_agriculture", label: "Agricultura Digital" },
  { value: "bioeconomy", label: "Bioeconomia" },
  { value: "education", label: "Educação" },
  { value: "logistics", label: "Logística" },
  { value: "health", label: "Saúde" },
];

type TeamFormProps = {
  team?: Team;
  onSubmit: (data: CreateLeaderTeamInput) => void;
  loading?: boolean;
};

function emptyMember(): TeamMember {
  return { name: "", role: "" };
}

export function TeamForm({ team, onSubmit, loading }: TeamFormProps) {
  const [name, setName] = useState(team?.name ?? "");
  const [description, setDescription] = useState(team?.description ?? "");
  const [solutionPillar, setSolutionPillar] = useState<SolutionPillar | "">(
    team?.solutionPillar ?? "",
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(team?.logoUrl ?? null);
  const [videoUrl, setVideoUrl] = useState(team?.videoUrl ?? "");
  const [secondaryVideoUrl, setSecondaryVideoUrl] = useState(
    team?.secondaryVideoUrl ?? "",
  );
  const [members, setMembers] = useState<TeamMember[]>(
    team?.teamMembers?.length ? team.teamMembers : [emptyMember()],
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(team?.logoUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadLeaderImage();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
    try {
      const publicUrl = await uploadMutation.mutateAsync(file);
      setLogoUrl(publicUrl);
    } catch {
      setLogoPreview(logoUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleAddMember() {
    setMembers((prev) => [...prev, emptyMember()]);
  }

  function handleRemoveMember(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMemberChange(
    index: number,
    field: keyof TeamMember,
    value: string,
  ) {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)),
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validMembers = members.filter((m) => m.name.trim() && m.role.trim());
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      solutionPillar: solutionPillar as SolutionPillar,
      logoUrl,
      videoUrl: videoUrl.trim() || null,
      secondaryVideoUrl: secondaryVideoUrl.trim() || null,
      teamMembers: validMembers.length > 0 ? validMembers : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="team-name" className="text-sm font-medium text-neutral-900">
          Nome da equipe
        </label>
        <input
          id="team-name"
          name="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
          placeholder="Ex: Equipe Açaí"
        />
      </div>

      <div>
        <span className="text-sm font-medium text-neutral-900">Logo da equipe</span>
        <div className="mt-1.5 flex items-center gap-4">
          {logoPreview ? (
            <div className="relative">
              <img
                src={logoPreview}
                alt="Logo da equipe"
                className="size-16 rounded-full border border-neutral-200 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setLogoUrl(null);
                  setLogoPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-neutral-900 text-white hover:bg-red-600"
                aria-label="Remover logo"
              >
                <XIcon className="size-3 shrink-0" />
              </button>
            </div>
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full border border-dashed border-neutral-300 bg-neutral-50">
              <UploadIcon className="size-5 shrink-0 stroke-neutral-400" />
            </div>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {logoPreview ? "Trocar imagem" : "Enviar imagem"}
            </Button>
            <p className="mt-1 text-xs text-neutral-500">
              PNG, JPG ou WebP. Máx. 4MB.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Selecionar arquivo de logo"
          />
        </div>
      </div>

      <div>
        <label htmlFor="team-description" className="text-sm font-medium text-neutral-900">
          Descrição
        </label>
        <textarea
          id="team-description"
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
          placeholder="Descreva a solução da equipe..."
        />
      </div>

      <div>
        <label htmlFor="team-pillar" className="text-sm font-medium text-neutral-900">
          Eixo de solução
        </label>
        <div className="relative mt-1.5 inline-grid w-full grid-cols-[1fr_--spacing(8)]">
          <select
            id="team-pillar"
            name="solutionPillar"
            value={solutionPillar}
            onChange={(e) =>
              setSolutionPillar(e.target.value as SolutionPillar)
            }
            required
            className="col-span-full row-start-1 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-3 py-2 pr-8 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
          >
            <option value="" disabled>Selecione um eixo</option>
            {PILLAR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 8 5"
            width="8"
            height="5"
            fill="none"
            className="pointer-events-none col-start-2 row-start-1 place-self-center"
          >
            <path d="M.5.5 4 4 7.5.5" stroke="currentcolor" />
          </svg>
        </div>
      </div>

      <div>
        <label htmlFor="team-video" className="text-sm font-medium text-neutral-900">
          URL do vídeo (YouTube)
        </label>
        <input
          id="team-video"
          name="videoUrl"
          type="url"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <div>
        <label htmlFor="team-video-2" className="text-sm font-medium text-neutral-900">
          URL do vídeo secundário (opcional)
        </label>
        <input
          id="team-video-2"
          name="secondaryVideoUrl"
          type="url"
          value={secondaryVideoUrl}
          onChange={(e) => setSecondaryVideoUrl(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-neutral-900">
          Membros da equipe
        </legend>
        <div className="mt-3 space-y-3">
          {members.map((member, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border border-neutral-200 bg-white p-3"
            >
              <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                <input
                  name={`member-name-${index}`}
                  type="text"
                  value={member.name}
                  onChange={(e) =>
                    handleMemberChange(index, "name", e.target.value)
                  }
                  className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
                  placeholder="Nome"
                  aria-label={`Nome do membro ${index + 1}`}
                />
                <input
                  name={`member-role-${index}`}
                  type="text"
                  value={member.role}
                  onChange={(e) =>
                    handleMemberChange(index, "role", e.target.value)
                  }
                  className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
                  placeholder="Função"
                  aria-label={`Função do membro ${index + 1}`}
                />
              </div>
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveMember(index)}
                  className="relative mt-1 flex size-8 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remover membro ${index + 1}`}
                >
                  <TrashIcon className="size-4 shrink-0" />
                  <span className="absolute top-1/2 left-1/2 size-[max(100%,3rem)] -translate-1/2 pointer-fine:hidden" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
        {members.length < 10 && (
          <button
            type="button"
            onClick={handleAddMember}
            className="mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary-100 hover:bg-primary-100/5"
          >
            <PlusIcon className="size-4 shrink-0" />
            Adicionar membro ({members.length}/10)
          </button>
        )}
      </fieldset>

      <div className="flex justify-end border-t border-neutral-200 pt-6">
        <Button
          type="submit"
          loading={loading}
          disabled={!name.trim() || !solutionPillar || uploadMutation.isPending}
          className="px-6"
        >
          {team ? "Salvar alterações" : "Criar equipe"}
        </Button>
      </div>
    </form>
  );
}
