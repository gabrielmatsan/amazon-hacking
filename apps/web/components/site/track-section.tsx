"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/umami";

// Fires `section-viewed { section }` once when the wrapped section first enters
// the viewport. The wrapper div is layout-neutral (full-width block).
export function TrackSection({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !fired.current) {
            fired.current = true;
            trackEvent("section-viewed", { section: name });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [name]);

  return <div ref={ref}>{children}</div>;
}
