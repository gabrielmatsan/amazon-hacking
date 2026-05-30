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
  { value: "verticalization", label: "Verticalização" },
];

const MAX_LOGO_SIZE_BYTES = 4 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function toYouTubeEmbed(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }

  const host = parsed.hostname.replace(/^(www\.|m\.)/, "");
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments[0] === "watch") {
      videoId = parsed.searchParams.get("v");
    } else if (
      segments[0] === "embed" ||
      segments[0] === "shorts" ||
      segments[0] === "live"
    ) {
      videoId = segments[1] ?? null;
    }
  }

  if (!videoId || !/^[\w-]{6,}$/.test(videoId)) return trimmed;
  return `https://www.youtube.com/embed/${videoId}`;
}

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
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadLeaderImage();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError(
        `Formato "${file.type || "desconhecido"}" não é aceito. Envie uma imagem PNG, JPG ou WebP.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setLogoError(
        `A imagem tem ${formatBytes(file.size)} e ultrapassa o limite de 4 MB. Comprima ou escolha uma versão menor antes de enviar.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
    try {
      const publicUrl = await uploadMutation.mutateAsync(file);
      setLogoUrl(publicUrl);
    } catch {
      setLogoPreview(logoUrl);
      setLogoError(
        "Não conseguimos enviar a imagem agora. Verifique sua conexão e tente novamente.",
      );
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
    const normalizedVideo = videoUrl.trim() ? toYouTubeEmbed(videoUrl) : null;
    const normalizedSecondary = secondaryVideoUrl.trim()
      ? toYouTubeEmbed(secondaryVideoUrl)
      : null;
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      solutionPillar: solutionPillar as SolutionPillar,
      logoUrl,
      videoUrl: normalizedVideo,
      secondaryVideoUrl: normalizedSecondary,
      teamMembers: validMembers.length > 0 ? validMembers : undefined,
    });
  }

  const isEdit = !!team;

  return (
    <div className="relative">
      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/85 backdrop-blur-sm"
        >
          <div className="flex flex-col items-center gap-3 px-6 text-center text-neutral-900">
            <div className="size-7 animate-spin rounded-full border-2 border-primary-100 border-t-transparent" />
            <p className="text-sm font-medium">
              {isEdit
                ? "Salvando alterações..."
                : "Enviando equipe para revisão..."}
            </p>
            <p className="text-xs text-neutral-500">
              Não feche esta página.
            </p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={loading} className="contents">
      <div>
        <label htmlFor="team-name" className="text-sm font-medium text-neutral-900">
          Nome do projeto
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
        {logoError && (
          <p
            role="alert"
            className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
          >
            {logoError}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="team-description" className="text-sm font-medium text-neutral-900">
          Descrição
        </label>
        <textarea
          id="team-description"
          name="description"
          rows={4}
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
          placeholder="Descreva a solução da equipe..."
          aria-describedby="team-description-counter"
        />
        <p
          id="team-description-counter"
          className="mt-1 text-right text-xs text-neutral-500"
        >
          {description.length}/500
        </p>
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
                  maxLength={100}
                  onChange={(e) =>
                    handleMemberChange(index, "name", e.target.value)
                  }
                  className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
                  placeholder="Nome (até 100)"
                  aria-label={`Nome do membro ${index + 1}`}
                />
                <input
                  name={`member-role-${index}`}
                  type="text"
                  value={member.role}
                  maxLength={40}
                  onChange={(e) =>
                    handleMemberChange(index, "role", e.target.value)
                  }
                  className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
                  placeholder="Função (até 40)"
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
        </fieldset>
      </form>
    </div>
  );
}
