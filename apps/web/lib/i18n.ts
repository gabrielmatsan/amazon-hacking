import "server-only";
import { cache } from "react";
import {
  overwriteGetLocale,
  baseLocale,
  isLocale,
  type Locale,
} from "@/lib/paraglide/runtime";

// Per-request, concurrency-safe locale holder. React's cache() scopes the
// returned object to a single server render pass, so concurrent requests with
// different locales never collide on a shared module global.
const requestLocale = cache((): { current: Locale } => ({ current: baseLocale }));

let overrideRegistered = false;

// Registers the paraglide getLocale() override. Kept inside a function (instead
// of a bare module-level call) so production tree-shaking can't drop it as a
// dead side-effect — setRequestLocale is always called by every route entry.
function ensureOverride(): void {
  if (overrideRegistered) return;
  overwriteGetLocale(() => requestLocale().current);
  overrideRegistered = true;
}

export function setRequestLocale(value: string | undefined | null): Locale {
  ensureOverride();
  const locale = isLocale(value) ? value : baseLocale;
  requestLocale().current = locale;
  return locale;
}
