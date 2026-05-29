"use client";

import { useState, useRef } from "react";
import {
  SearchIcon,
  UserIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useSearchUsersByEmail,
  useCreateAdminTeam,
  useUploadAdminImage,
} from "@/hooks/use-admin-teams";
import type { AuthUser } from "@/lib/api/types";
import type { SolutionPillar, TeamMember } from "@/lib/api/types";

const PILLAR_OPTIONS: { value: SolutionPillar; label: string }[] = [
  { value: "digital_agriculture", label: "Agricultura Digital" },
  { value: "bioeconomy", label: "Bioeconomia" },
  { value: "education", label: "Educação" },
  { value: "logistics", label: "Logística" },
  { value: "health", label: "Saúde" },
];

const ROLE_LABELS: Record<string, string> = {
  user: "Usuário",
  mentor: "Mentor",
  admin: "Admin",
  leader: "Líder",
};

function emptyMember(): TeamMember {
  return { name: "", role: "" };
}

function UserCard({
  user,
  selected,
  onSelect,
}: {
  user: AuthUser;
  selected: boolean;
  onSelect: () => void;
}) {
  const isAdmin = user.role === "admin";
  const hasTeam = !!user.teamId;
  const disabled = isAdmin || hasTeam;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected
          ? "border-primary-100 bg-primary-100/5 ring-1 ring-primary-100"
          : disabled
            ? "cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-60"
            : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50"
      }`}
    >
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-neutral-100">
        <UserIcon className="size-4 stroke-neutral-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-neutral-900">
          {user.name}
        </p>
        <p className="truncate text-xs text-neutral-500">{user.email}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            user.role === "leader"
              ? "bg-emerald-50 text-emerald-700"
              : user.role === "admin"
                ? "bg-red-50 text-red-700"
                : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {ROLE_LABELS[user.role] ?? user.role}
        </span>
        {hasTeam && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Já tem equipe
          </span>
        )}
        {selected && (
          <CheckIcon className="size-4 stroke-primary-100" />
        )}
      </div>
    </button>
  );
}

export function AdminCreateTeam() {
  const [searchEmail, setSearchEmail] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);
  const [showRoleWarning, setShowRoleWarning] = useState(false);
  const [roleConfirmed, setRoleConfirmed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [solutionPillar, setSolutionPillar] = useState<SolutionPillar | "">("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [secondaryVideoUrl, setSecondaryVideoUrl] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([emptyMember()]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [success, setSuccess] = useState(false);

  const { data: users, isLoading: searching } = useSearchUsersByEmail(debouncedEmail);
  const createMutation = useCreateAdminTeam();
  const uploadMutation = useUploadAdminImage();

  function handleSearchChange(value: string) {
    setSearchEmail(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedEmail(value), 400);
  }

  function handleSelectUser(user: AuthUser) {
    if (selectedUser?.id === user.id) {
      setSelectedUser(null);
      setShowRoleWarning(false);
      setRoleConfirmed(false);
      return;
    }
    setSelectedUser(user);
    if (user.role !== "leader") {
      setShowRoleWarning(true);
      setRoleConfirmed(false);
    } else {
      setShowRoleWarning(false);
      setRoleConfirmed(true);
    }
  }

  function handleConfirmRole() {
    setRoleConfirmed(true);
    setShowRoleWarning(false);
  }

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
    createMutation.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        solutionPillar: solutionPillar as SolutionPillar,
        logoUrl,
        videoUrl: videoUrl.trim() || null,
        secondaryVideoUrl: secondaryVideoUrl.trim() || null,
        teamMembers: validMembers.length > 0 ? validMembers : undefined,
        leaderId: selectedUser?.id,
      },
      {
        onSuccess: () => {
          setSuccess(true);
        },
      },
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-emerald-300 bg-emerald-50 py-16">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckIcon className="size-6 stroke-emerald-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-emerald-800">
          Equipe criada com sucesso!
        </p>
        <p className="mt-1 text-xs text-emerald-600">
          A equipe já está ativa e visível no site.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false);
            setSelectedUser(null);
            setRoleConfirmed(false);
            setShowRoleWarning(false);
            setSearchEmail("");
            setDebouncedEmail("");
            setName("");
            setDescription("");
            setSolutionPillar("");
            setLogoUrl(null);
            setLogoPreview(null);
            setVideoUrl("");
            setSecondaryVideoUrl("");
            setMembers([emptyMember()]);
          }}
          className="mt-4 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
        >
          Cadastrar outra equipe
        </button>
      </div>
    );
  }

  const leaderReady = selectedUser && roleConfirmed;

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900 tracking-tight">
        Cadastrar equipe
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Busque o líder pelo e-mail, preencha os dados e crie a equipe diretamente como ativa.
      </p>

      {/* Step 1: Search leader */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-neutral-900">
          1. Buscar líder da equipe
        </h2>
        <div className="relative mt-2">
          <SearchIcon className="absolute top-1/2 left-3 size-4 -translate-y-1/2 stroke-neutral-400" />
          <input
            type="text"
            value={searchEmail}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Digite o e-mail do líder..."
            className="w-full rounded-lg border border-neutral-300 py-2 pr-3 pl-9 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
          />
          {searching && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2">
              <div className="size-4 animate-spin rounded-full border-2 border-primary-100 border-t-transparent" />
            </div>
          )}
        </div>

        {debouncedEmail.length >= 3 && users && (
          <div className="mt-3 space-y-2">
            {users.length === 0 ? (
              <p className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 py-4 text-center text-sm text-neutral-500">
                Nenhum usuário encontrado.
              </p>
            ) : (
              users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  selected={selectedUser?.id === user.id}
                  onSelect={() => handleSelectUser(user)}
                />
              ))
            )}
          </div>
        )}

        {/* Role warning */}
        {showRoleWarning && selectedUser && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangleIcon className="mt-0.5 size-5 shrink-0 stroke-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {selectedUser.name} não é líder
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  A role atual deste usuário é{" "}
                  <strong>{ROLE_LABELS[selectedUser.role] ?? selectedUser.role}</strong>.
                  Ao criar a equipe, ele será automaticamente promovido a Líder.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUser(null);
                      setShowRoleWarning(false);
                    }}
                    className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRole}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700"
                  >
                    Confirmar e tornar líder
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selected leader badge */}
        {leaderReady && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5">
            <ShieldCheckIcon className="size-4 shrink-0 stroke-emerald-600" />
            <span className="text-sm text-emerald-800">
              Líder: <strong>{selectedUser.name}</strong> ({selectedUser.email})
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedUser(null);
                setRoleConfirmed(false);
              }}
              className="ml-auto rounded p-0.5 text-emerald-600 hover:bg-emerald-100"
              aria-label="Remover líder"
            >
              <XIcon className="size-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Step 2: Team form */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-900">
          2. Dados da equipe
        </h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div>
            <label htmlFor="admin-team-name" className="text-sm font-medium text-neutral-900">
              Nome do projeto
            </label>
            <input
              id="admin-team-name"
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
            <label htmlFor="admin-team-description" className="text-sm font-medium text-neutral-900">
              Descrição
            </label>
            <textarea
              id="admin-team-description"
              rows={4}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
              placeholder="Descreva a solução da equipe..."
              aria-describedby="admin-team-description-counter"
            />
            <p
              id="admin-team-description-counter"
              className="mt-1 text-right text-xs text-neutral-500"
            >
              {description.length}/500
            </p>
          </div>

          <div>
            <label htmlFor="admin-team-pillar" className="text-sm font-medium text-neutral-900">
              Eixo de solução
            </label>
            <div className="relative mt-1.5 inline-grid w-full grid-cols-[1fr_--spacing(8)]">
              <select
                id="admin-team-pillar"
                value={solutionPillar}
                onChange={(e) => setSolutionPillar(e.target.value as SolutionPillar)}
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
            <label htmlFor="admin-team-video" className="text-sm font-medium text-neutral-900">
              URL do vídeo (YouTube)
            </label>
            <input
              id="admin-team-video"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label htmlFor="admin-team-video-2" className="text-sm font-medium text-neutral-900">
              URL do vídeo secundário (opcional)
            </label>
            <input
              id="admin-team-video-2"
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
                      type="text"
                      value={member.name}
                      maxLength={100}
                      onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                      className="w-full rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900 outline-none ring-1 ring-transparent focus:border-primary-100 focus:ring-primary-100 max-sm:text-base/6"
                      placeholder="Nome (até 100)"
                      aria-label={`Nome do membro ${index + 1}`}
                    />
                    <input
                      type="text"
                      value={member.role}
                      maxLength={40}
                      onChange={(e) => handleMemberChange(index, "role", e.target.value)}
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

          {createMutation.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Erro ao criar equipe. Verifique os dados e tente novamente.
            </div>
          )}

          <div className="flex justify-end border-t border-neutral-200 pt-6">
            <Button
              type="submit"
              loading={createMutation.isPending}
              disabled={!name.trim() || !solutionPillar || uploadMutation.isPending}
              className="px-6"
            >
              Criar equipe
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
