"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { localizeHref, type Locale } from "@/lib/paraglide/runtime";
import { m } from "@/lib/paraglide/messages";
import { cn } from "@/lib/utils";
import { LocaleSwitch } from "./locale-switch";

const anchors = [
  { href: "#sobre", key: "about" },
  { href: "#edicoes", key: "editions" },
  { href: "#vencedores", key: "winners" },
  { href: "#parceiros", key: "partners" },
] as const;

export function Header({ locale }: { locale: Locale }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 rounded-b-[30px] transition-colors duration-500",
        scrolled ? "bg-neutrals-700/95 backdrop-blur-sm shadow-lg" : "bg-transparent",
      )}
    >
      <div className="mx-auto grid h-20 max-w-screen-2xl grid-cols-[1fr_auto_1fr] items-center px-6 lg:px-12">
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
          <ul className="flex items-center gap-8 text-sm font-bold tracking-wide text-white uppercase">
            {anchors.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="opacity-90 transition hover:opacity-100">
                  {labels[item.key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3 justify-self-end">
          <Link
            href={localizeHref("/solucoes")}
            className="hidden rounded-full bg-primary-100 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-200 lg:inline-flex"
          >
            {solutionsLabel}
          </Link>
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
      {open && (
        <nav
          aria-label="Mobile"
          className="rounded-b-[30px] border-t border-white/10 bg-neutrals-700 lg:hidden"
        >
          <ul className="flex flex-col gap-1 px-6 py-4 text-base font-bold tracking-wide text-white uppercase">
            {anchors.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 opacity-90 hover:opacity-100"
                >
                  {labels[item.key]}
                </a>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-4 border-t border-white/10 px-6 py-5">
            <Link
              href={localizeHref("/solucoes")}
              onClick={() => setOpen(false)}
              className="inline-flex w-fit rounded-full bg-primary-100 px-6 py-3 text-sm font-bold text-white"
            >
              {solutionsLabel}
            </Link>
            <LocaleSwitch variant="inline" onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  );
}
