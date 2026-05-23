import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Amazon Hacking · 2026";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "64px 80px",
          backgroundImage:
            "radial-gradient(120% 80% at 75% 25%, #0165b7 0%, transparent 60%), radial-gradient(80% 80% at 15% 90%, #059177 0%, transparent 55%), linear-gradient(135deg, #00335b 0%, #014780 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            letterSpacing: 4,
            opacity: 0.75,
            textTransform: "uppercase",
          }}
        >
          <span>Amazon Hacking · 2026</span>
          <span>CESUPA</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 88,
              lineHeight: 1.02,
              fontWeight: 600,
              letterSpacing: -2,
              maxWidth: 1000,
              display: "flex",
            }}
          >
            Onde a Amazônia encontra a inovação
          </div>
          <div style={{ fontSize: 28, opacity: 0.8, maxWidth: 900, display: "flex" }}>
            22ª edição · Vila Jutaí, Moju – Pará
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
