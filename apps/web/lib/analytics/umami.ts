// Type-safe wrappers over the global Umami tracker. No-ops on the server or when
// the tracker hasn't loaded (env-gated), so callers never have to guard.

type UmamiEventData = Record<string, string | number | boolean | undefined>;

type UmamiApi = {
  track: (eventName: string, data?: UmamiEventData) => void;
  identify: (idOrData: string | UmamiEventData, data?: UmamiEventData) => void;
};

declare global {
  interface Window {
    umami?: UmamiApi;
  }
}

export function trackEvent(eventName: string, data?: UmamiEventData): void {
  if (typeof window === "undefined" || !window.umami) return;
  window.umami.track(eventName, data);
}

// Binds a Distinct ID to the current cookieless session so the visitor's whole
// journey is searchable in Umami → Sessions under this id.
export function identifyVisitor(id: string, data?: UmamiEventData): void {
  if (typeof window === "undefined" || !window.umami) return;
  window.umami.identify({ id, ...data });
}
