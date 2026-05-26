"use client";

import { useAuth } from "@/hooks/use-auth";
import { getGoogleLoginUrl, logout } from "@/lib/api/auth";
import { usePathname } from "next/navigation";
import {
  ShieldCheckIcon,
  ClipboardListIcon,
  BarChart3Icon,
  AlertTriangleIcon,
  SettingsIcon,
  LogOutIcon,
  ArrowLeftIcon,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export function AdminShell({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string;
}) {
  const { data: user, isLoading, isError } = useAuth();
  const queryClient = useQueryClient();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary-100 border-t-transparent" />
      </div>
    );
  }

  if (isError || !user || user.role !== "admin") {
    if (typeof window !== "undefined") {
      window.location.href = getGoogleLoginUrl(`/${locale}/admin`);
    }
    return null;
  }

  const base = locale === "pt-br" ? "" : locale + "/";

  async function handleLogout() {
    await logout();
    queryClient.clear();
    window.location.href = `/${locale === "pt-br" ? "" : locale}`;
  }

  return (
    <div className="flex min-h-dvh bg-neutral-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-neutral-200 bg-white lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-neutral-200 px-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-400">
            <ShieldCheckIcon className="size-4 shrink-0 stroke-white" />
          </div>
          <span className="text-sm font-semibold text-neutral-900 truncate">
            Painel Admin
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3" role="list">
          <a
            href={`/${base}admin`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              pathname.endsWith("/admin") || pathname.endsWith("/admin/")
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <ClipboardListIcon className="size-4 shrink-0 stroke-neutral-500" />
            Revisão de equipes
          </a>
          <a
            href={`/${base}admin/votes`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              pathname.endsWith("/admin/votes") || pathname.endsWith("/admin/votes/")
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <BarChart3Icon className="size-4 shrink-0 stroke-neutral-500" />
            Votos
          </a>
          <a
            href={`/${base}admin/flagged`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              pathname.includes("/admin/flagged")
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <AlertTriangleIcon className="size-4 shrink-0 stroke-neutral-500" />
            Flagged
          </a>
          <a
            href={`/${base}admin/config`}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
              pathname.includes("/admin/config")
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <SettingsIcon className="size-4 shrink-0 stroke-neutral-500" />
            Configurações
          </a>
        </nav>

        <div className="flex flex-col gap-1 border-t border-neutral-200 p-3">
          <a
            href={`/${locale === "pt-br" ? "" : locale}`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            <ArrowLeftIcon className="size-4 shrink-0 stroke-neutral-400" />
            Voltar ao site
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            <LogOutIcon className="size-4 shrink-0 stroke-neutral-400" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary-400">
            <ShieldCheckIcon className="size-4 shrink-0 stroke-white" />
          </div>
          <span className="text-sm font-semibold text-neutral-900">
            Painel Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/${locale === "pt-br" ? "" : locale}`}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            <ArrowLeftIcon className="size-4 shrink-0 stroke-neutral-400" />
          </a>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
          >
            <LogOutIcon className="size-4 shrink-0 stroke-neutral-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 pt-14 lg:ml-56 lg:pt-0">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
