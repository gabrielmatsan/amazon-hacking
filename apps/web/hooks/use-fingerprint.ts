"use client";

import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { useEffect, useRef } from "react";

export function useFingerprint() {
  const visitorIdRef = useRef<string | null>(null);

  useEffect(() => {
    FingerprintJS.load().then((fp) =>
      fp.get().then((result) => {
        visitorIdRef.current = result.visitorId;
      }),
    );
  }, []);

  return () => visitorIdRef.current;
}
