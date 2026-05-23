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
  variant?: "popover" | "mobile";
  onNavigate?: () => void;
}) {
  const pathname = usePathname() || "/";
  const basePath = stripLocale(pathname);
  const active = currentLocale(pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

  const isMobile = variant === "mobile";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Idioma"
        className={cn(
          "flex items-center gap-1.5 rounded-full border border-white/30 font-bold tracking-[0.12em] text-white uppercase transition hover:border-white/60",
          isMobile
            ? "px-6 py-3 text-sm"
            : "px-3 py-1.5 text-xs",
        )}
      >
        {isMobile ? fullLabels[active] : labels[active]}
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
          className={cn(
            "absolute z-50 mt-2 overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-black/10",
            isMobile ? "left-1/2 w-56 -translate-x-1/2" : "right-0 w-40",
          )}
        >
          {locales.map((locale) => {
            const isActive = locale === active;
            return (
              <Link
                key={locale}
                href={hrefFor(locale, basePath)}
                hrefLang={locale}
                role="menuitem"
                aria-current={isActive ? "true" : undefined}
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
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
