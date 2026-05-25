"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { localizeHref, type Locale } from "@/lib/paraglide/runtime";
import { m } from "@/lib/paraglide/messages";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { getGoogleLoginUrl, logout } from "@/lib/api/auth";
import { useQueryClient } from "@tanstack/react-query";
import { LocaleSwitch } from "./locale-switch";

const anchors = [
  { href: "#sobre", key: "about" },
  { href: "#edicoes", key: "editions" },
  { href: "#vencedores", key: "winners" },
  { href: "#parceiros", key: "partners" },
] as const;

export function Header({
  locale,
  variant = "home",
}: {
  locale: Locale;
  variant?: "home" | "inner";
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const isInner = variant === "inner";
  const pathname = usePathname();
  const { data: user } = useAuth();
  const queryClient = useQueryClient();
  const loginUrl = getGoogleLoginUrl(pathname);

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    window.location.reload();
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY >= 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const labels: Record<string, string> = {
    about: m.nav_about({}, { locale }),
    editions: m.nav_editions({}, { locale }),
    winners: m.nav_winners({}, { locale }),
    partners: m.nav_partners({}, { locale }),
  };
  const solutionsLabel = m.nav_solutions({}, { locale });
  const backHomeLabel = m.nav_back_home({}, { locale });
  const solid = isInner || scrolled;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 rounded-b-[30px] transition-colors duration-500",
        open
          ? "bg-neutrals-700 shadow-lg"
          : solid
            ? "bg-neutrals-700/95 backdrop-blur-sm shadow-lg"
            : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-6 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:px-12">
        <Link
          href={localizeHref("/")}
          aria-label="Amazon Hacking"
          className="justify-self-start"
        >
          <Image
            src="/illustrations/logo-amazon-hacking-white.svg"
            alt="Amazon Hacking"
            width={150}
            height={56}
            priority
            className="h-10 w-auto md:h-12"
          />
        </Link>

        <nav aria-label="Principal" className="hidden justify-self-center lg:block">
          {isInner ? (
            <Link
              href={localizeHref("/")}
              className="inline-flex items-center gap-2 text-sm font-bold tracking-wide text-white uppercase opacity-90 transition hover:opacity-100"
            >
              <BackArrow />
              {backHomeLabel}
            </Link>
          ) : (
            <ul className="flex items-center gap-8 text-sm font-bold tracking-wide text-white uppercase">
              {anchors.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="opacity-90 transition hover:opacity-100">
                    {labels[item.key]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="flex items-center gap-3 justify-self-end">
          {!isInner && (
            <Link
              href={localizeHref("/solucoes")}
              className="hidden rounded-full bg-primary-100 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-200 lg:inline-flex"
            >
              {solutionsLabel}
            </Link>
          )}
          <div className="hidden lg:block">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-white">
                  {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-medium text-white/70 hover:text-white"
                >
                  Sair
                </button>
              </div>
            ) : (
              <a
                href={loginUrl}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
              >
                Entrar
              </a>
            )}
          </div>
          <div className="hidden lg:block">
            <LocaleSwitch />
          </div>
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center text-white lg:hidden"
          >
            <span className="relative block h-4 w-6">
              <span
                className={cn(
                  "absolute left-0 h-0.5 w-6 bg-current transition-all",
                  open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0",
                )}
              />
              <span
                className={cn(
                  "absolute top-1/2 left-0 h-0.5 w-6 -translate-y-1/2 bg-current transition-all",
                  open && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 h-0.5 w-6 bg-current transition-all",
                  open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            key="mobile-menu"
            aria-label="Mobile"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-b-[30px] border-t border-white/10 bg-neutrals-700 shadow-lg lg:hidden"
          >
            <ul className="flex flex-col items-center gap-1 px-6 py-6 text-base font-bold tracking-wide text-white uppercase">
              {isInner ? (
                <li className="w-full">
                  <Link
                    href={localizeHref("/")}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 opacity-90 transition hover:opacity-100"
                  >
                    <BackArrow />
                    {backHomeLabel}
                  </Link>
                </li>
              ) : (
                anchors.map((item) => (
                  <li key={item.href} className="w-full">
                    <a
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block py-3 text-center opacity-90 transition hover:opacity-100"
                    >
                      {labels[item.key]}
                    </a>
                  </li>
                ))
              )}
            </ul>
            <div className="flex flex-col items-center gap-4 border-t border-white/10 px-6 py-6">
              {!isInner && (
                <Link
                  href={localizeHref("/solucoes")}
                  onClick={() => setOpen(false)}
                  className="inline-flex rounded-full bg-primary-100 px-8 py-3 text-sm font-bold text-white transition hover:bg-primary-200"
                >
                  {solutionsLabel}
                </Link>
              )}
              {user ? (
                <button
                  type="button"
                  onClick={() => { handleLogout(); setOpen(false); }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-white">
                    {user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </span>
                  Sair
                </button>
              ) : (
                <a
                  href={loginUrl}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20"
                >
                  Entrar
                </a>
              )}
              <LocaleSwitch variant="mobile" onNavigate={() => setOpen(false)} />
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M10 3.5L5.5 8l4.5 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
