import { eq, isNotNull, or } from "drizzle-orm";
import { db } from "../src/shared/infra/databases/postgres";
import { teamsSchema } from "../src/teams/domain/teams.schema";

function toYouTubeEmbed(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }

  const host = parsed.hostname.replace(/^(www\.|m\.)/, "");
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments[0] === "watch") {
      videoId = parsed.searchParams.get("v");
    } else if (
      segments[0] === "embed" ||
      segments[0] === "shorts" ||
      segments[0] === "live"
    ) {
      videoId = segments[1] ?? null;
    }
  }

  if (!videoId || !/^[\w-]{6,}$/.test(videoId)) return trimmed;
  return `https://www.youtube.com/embed/${videoId}`;
}

async function main() {
  const execute = process.argv.includes("--execute");
  const mode = execute ? "EXECUTE" : "DRY-RUN";

  console.log(`\n[${mode}] Scanning teams for YouTube URLs to normalize...\n`);

  const teams = await db
    .select({
      id: teamsSchema.id,
      name: teamsSchema.name,
      videoUrl: teamsSchema.videoUrl,
      secondaryVideoUrl: teamsSchema.secondaryVideoUrl,
    })
    .from(teamsSchema)
    .where(
      or(
        isNotNull(teamsSchema.videoUrl),
        isNotNull(teamsSchema.secondaryVideoUrl),
      ),
    );

  console.log(`Found ${teams.length} teams with at least one video URL\n`);

  let changed = 0;
  let unchanged = 0;
  let unrecognized = 0;

  for (const team of teams) {
    const updates: { videoUrl?: string; secondaryVideoUrl?: string } = {};
    const reports: string[] = [];

    if (team.videoUrl) {
      const next = toYouTubeEmbed(team.videoUrl);
      if (next !== team.videoUrl) {
        if (next.includes("/embed/")) {
          updates.videoUrl = next;
          reports.push(`  videoUrl:           ${team.videoUrl}\n                   → ${next}`);
        } else {
          unrecognized++;
          reports.push(`  videoUrl (skip):    ${team.videoUrl}  [não-YouTube, mantém]`);
        }
      } else if (team.videoUrl.includes("/embed/")) {
        reports.push(`  videoUrl (ok):      ${team.videoUrl}`);
      } else {
        unrecognized++;
        reports.push(`  videoUrl (skip):    ${team.videoUrl}  [formato desconhecido, mantém]`);
      }
    }

    if (team.secondaryVideoUrl) {
      const next = toYouTubeEmbed(team.secondaryVideoUrl);
      if (next !== team.secondaryVideoUrl) {
        if (next.includes("/embed/")) {
          updates.secondaryVideoUrl = next;
          reports.push(`  secondaryVideoUrl:  ${team.secondaryVideoUrl}\n                   → ${next}`);
        } else {
          unrecognized++;
          reports.push(`  secondaryVideoUrl (skip): ${team.secondaryVideoUrl}  [não-YouTube, mantém]`);
        }
      } else if (team.secondaryVideoUrl.includes("/embed/")) {
        reports.push(`  secondaryVideoUrl (ok): ${team.secondaryVideoUrl}`);
      } else {
        unrecognized++;
        reports.push(`  secondaryVideoUrl (skip): ${team.secondaryVideoUrl}  [formato desconhecido, mantém]`);
      }
    }

    const hasUpdate = Object.keys(updates).length > 0;
    if (hasUpdate || reports.length > 0) {
      console.log(`[${team.id}] ${team.name}`);
      for (const line of reports) console.log(line);
    }

    if (hasUpdate) {
      changed++;
      if (execute) {
        await db.update(teamsSchema).set(updates).where(eq(teamsSchema.id, team.id));
        console.log(`  ✓ updated`);
      }
      console.log("");
    } else {
      unchanged++;
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Resumo [${mode}]:`);
  console.log(`  ${changed} time(s) com URLs pra atualizar`);
  console.log(`  ${unchanged} time(s) já em formato embed ou sem mudança`);
  console.log(`  ${unrecognized} URL(s) ignoradas (não reconhecidas como YouTube)`);
  if (!execute && changed > 0) {
    console.log(`\nRode novamente com --execute pra aplicar as mudanças.`);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
