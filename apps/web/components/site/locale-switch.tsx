"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, type Locale } from "@/lib/paraglide/runtime";
import { cn } from "@/lib/utils";

const labels: Record<Locale, string> = {
  "pt-br": "PT",
  en: "EN",
  es: "ES",
};

const fullLabels: Record<Locale, string> = {
  "pt-br": "Português",
  en: "English",
  es: "Español",
};

const prefixes = locales.filter((locale) => locale !== "pt-br");

function stripLocale(pathname: string): string {
  for (const prefix of prefixes) {
    if (pathname === `/${prefix}`) return "/";
    if (pathname.startsWith(`/${prefix}/`)) return pathname.slice(prefix.length + 1);
  }
  return pathname || "/";
}

function currentLocale(pathname: string): Locale {
  for (const prefix of prefixes) {
    if (pathname === `/${prefix}` || pathname.startsWith(`/${prefix}/`)) return prefix;
  }
  return "pt-br";
}

function hrefFor(locale: Locale, basePath: string): string {
  if (locale === "pt-br") return basePath;
  return basePath === "/" ? `/${locale}` : `/${locale}${basePath}`;
}

export function LocaleSwitch({
  className,
  variant = "popover",
  onNavigate,
}: {
  className?: string;
  variant?: "popover" | "inline";
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || "/";
  const basePath = stripLocale(pathname);
  const active = currentLocale(pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (variant === "inline") {
    return (
      <div className={cn("flex items-center gap-2", className)} aria-label="Idioma">
        {locales.map((locale) => {
          const isActive = locale === active;
          return (
            <Link
              key={locale}
              href={hrefFor(locale, basePath)}
              hrefLang={locale}
              aria-current={isActive ? "true" : undefined}
              onClick={onNavigate}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-bold tracking-[0.12em] uppercase transition",
                isActive
                  ? "bg-white text-primary-100"
                  : "border border-white/30 text-white/70 hover:text-white",
              )}
            >
              {labels[locale]}
            </Link>
          );
        })}
      </div>
    );
  }

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Idioma"
        className="flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-white uppercase transition hover:border-white/60"
      >
        {labels[active]}
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          className={cn("transition-transform", open && "rotate-180")}
          aria-hidden
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-black/10"
        >
          {locales.map((locale) => {
            const isActive = locale === active;
            return (
              <Link
                key={locale}
                href={hrefFor(locale, basePath)}
                hrefLang={locale}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 text-sm transition",
                  isActive
                    ? "bg-primary-100/10 font-bold text-primary-100"
                    : "text-neutrals-600 hover:bg-neutrals-100",
                )}
              >
                {fullLabels[locale]}
                <span className="text-[10px] font-bold tracking-[0.12em] text-neutrals-400 uppercase">
                  {labels[locale]}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
