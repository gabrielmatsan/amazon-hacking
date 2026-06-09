import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Amazon Hacking · Solução";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function fetchName(slug: string): Promise<string | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/v1";
  try {
    const res = await fetch(`${apiUrl}/teams/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { name?: string } };
    return json.data?.name ?? null;
  } catch {
    return null;
  }
}

export default async function SolutionOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const name = (await fetchName(slug)) ?? "Soluções";

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
          backgroundColor: "#00335b",
          backgroundImage:
            "radial-gradient(120% 80% at 80% 20%, #0ae7bd 0%, transparent 55%), radial-gradient(90% 90% at 10% 95%, #0165b7 0%, transparent 55%), linear-gradient(135deg, #00335b 0%, #014780 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, fontWeight: 600, letterSpacing: 2, color: "rgba(255,255,255,0.85)" }}>
          AMAZON HACKING · 2026
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 600, color: "#0ae7bd" }}>Apoie a solução</div>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>
            {name}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#0ae7bd",
              color: "#00335b",
              fontSize: 30,
              fontWeight: 800,
              padding: "14px 32px",
              borderRadius: 999,
            }}
          >
            VOTE AGORA
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "rgba(255,255,255,0.8)" }}>amazon-hacking.com</div>
        </div>
      </div>
    ),
    size,
  );
}
