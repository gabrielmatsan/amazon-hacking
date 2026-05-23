"use client";

import { useEffect, useState } from "react";
import { m } from "@/lib/paraglide/messages";
import type { Locale } from "@/lib/paraglide/runtime";

const STORAGE_KEY = "ah-cookie-banner-dismissed";

export function CookieBanner({ locale }: { locale: Locale }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Cookies"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10 md:flex md:items-center md:gap-6 md:p-5"
    >
      <p className="text-sm leading-relaxed text-neutrals-600">
        {m.cookie_banner_message({}, { locale })}
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(STORAGE_KEY, "1");
          setDismissed(true);
        }}
        className="mt-3 inline-flex items-center justify-center rounded-md bg-primary-100 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-200 md:mt-0 md:shrink-0"
      >
        {m.cookie_banner_dismiss({}, { locale })}
      </button>
    </div>
  );
}
