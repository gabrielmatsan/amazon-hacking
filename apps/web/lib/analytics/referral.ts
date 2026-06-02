// "Minha torcida" attribution: a supporter shares a link carrying ?ref=<userId>.
// We persist that ref on landing so it can be attached to the vote-submitted event,
// crediting the supporter who brought the voter.

const REF_KEY = "ah_torcida_ref";
const MAX_REF_LENGTH = 64;

// Reads ?ref= from the current URL and stores it. Call on /solucoes entry points.
export function captureRefFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const ref = new URLSearchParams(window.location.search).get("ref")?.trim();
    if (ref && ref.length <= MAX_REF_LENGTH) {
      window.localStorage.setItem(REF_KEY, ref);
    }
  } catch {
    // ignore storage/URL errors
  }
}

export function getStoredRef(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(REF_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}
