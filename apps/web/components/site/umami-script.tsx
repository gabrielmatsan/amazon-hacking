import Script from "next/script";

// Derives the recorder URL from the tracker URL so a single host env covers both
// (…/script.js → …/recorder.js). Falls back to the script's directory.
function toRecorderSrc(src: string): string {
  if (/script\.js(\?.*)?$/.test(src)) return src.replace(/script\.js(\?.*)?$/, "recorder.js");
  return src.replace(/[^/]*$/, "recorder.js");
}

export function UmamiScript() {
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  if (!src || !websiteId) return null;

  // Session replay loads by default; set NEXT_PUBLIC_UMAMI_RECORDER=false to opt out.
  const recorderEnabled = process.env.NEXT_PUBLIC_UMAMI_RECORDER !== "false";
  const sampleRate = process.env.NEXT_PUBLIC_UMAMI_RECORDER_SAMPLE_RATE ?? "0.15";
  const maskLevel = process.env.NEXT_PUBLIC_UMAMI_RECORDER_MASK_LEVEL ?? "moderate";
  const maxDuration = process.env.NEXT_PUBLIC_UMAMI_RECORDER_MAX_DURATION ?? "300000";

  return (
    <>
      <Script
        src={src}
        data-website-id={websiteId}
        strategy="afterInteractive"
        defer
      />
      {recorderEnabled && (
        <Script
          src={toRecorderSrc(src)}
          data-website-id={websiteId}
          data-sample-rate={sampleRate}
          data-mask-level={maskLevel}
          data-max-duration={maxDuration}
          strategy="afterInteractive"
          defer
        />
      )}
    </>
  );
}
