// Generates a 1080×1920 Instagram-Stories card for a solution and shares it via
// the Web Share API (files) — which lets the user post it straight to their
// Story on mobile — or downloads it as a fallback. No dependencies.

type StickerInput = { teamName: string; url: string; locale: "pt-br" | "en" | "es" };

const CTA: Record<StickerInput["locale"], { back: string; cta: string }> = {
  "pt-br": { back: "Apoie a solução", cta: "VOTE AGORA" },
  en: { back: "Back the solution", cta: "VOTE NOW" },
  es: { back: "Apoya la solución", cta: "VOTA AHORA" },
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

async function renderSticker({ teamName, url, locale }: StickerInput): Promise<Blob> {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unsupported");

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#00335b");
  bg.addColorStop(0.55, "#014780");
  bg.addColorStop(1, "#0165b7");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, 700);
  glow.addColorStop(0, "rgba(10,231,189,0.35)");
  glow.addColorStop(1, "rgba(10,231,189,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "600 40px sans-serif";
  ctx.fillText("AMAZON HACKING 2026", W / 2, 320);

  ctx.fillStyle = "#0ae7bd";
  ctx.font = "600 48px sans-serif";
  ctx.fillText(CTA[locale].back, W / 2, 760);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 96px sans-serif";
  const lines = wrapText(ctx, teamName, W - 200);
  lines.forEach((line, i) => ctx.fillText(line, W / 2, 900 + i * 110));

  // CTA pill
  const pillW = 520;
  const pillH = 130;
  const pillX = (W - pillW) / 2;
  const pillY = 1340;
  ctx.fillStyle = "#0ae7bd";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 65);
  ctx.fill();
  ctx.fillStyle = "#00335b";
  ctx.font = "800 56px sans-serif";
  ctx.fillText(CTA[locale].cta, W / 2, pillY + 86);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "500 38px sans-serif";
  const shortUrl = url.replace(/^https?:\/\//, "").split("?")[0] ?? "";
  ctx.fillText(shortUrl, W / 2, 1640);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png"),
  );
}

export async function shareStorySticker(input: StickerInput): Promise<"shared" | "downloaded"> {
  const blob = await renderSticker(input);
  const file = new File([blob], "amazon-hacking-story.png", { type: "image/png" });

  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav?.canShare?.({ files: [file] })) {
    await nav.share({ files: [file], title: input.teamName }).catch(() => undefined);
    return "shared";
  }

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = file.name;
  link.click();
  URL.revokeObjectURL(link.href);
  return "downloaded";
}
