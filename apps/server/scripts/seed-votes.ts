import { createHash } from "node:crypto";

import { db, shutdownPools } from "../src/shared/infra/databases/postgres";
import { teamsSchema } from "../src/teams/domain/teams.schema";
import { usersSchema } from "../src/users/domain/users.schema";
import { votesTokensSchema } from "../src/votes-token/domain/votes-tokens.schema";
import { normalizeEmail } from "../src/shared/utils/normalize-email";
import { voteForTimeByIdUseCase } from "../src/votes/application/vote-for-time-by-id.usecase";
import { votesDashboardUseCase } from "../src/votes/application/votes-dashboard.usecase";

const TEST_IPS = [
  { ip: "8.8.8.8", label: "Google DNS (datacenter)" },
  { ip: "1.1.1.1", label: "Cloudflare DNS (datacenter)" },
  { ip: "185.220.101.1", label: "Tor exit node" },
  { ip: "177.134.161.4", label: "IP residencial" },
];

const VOTERS = [
  { name: "Seed User Alpha", email: "seed.alpha@gmail.com", phone: "+5511999990001" },
  { name: "Seed User Beta", email: "seed.beta@hotmail.com", phone: "+5521999990002" },
  { name: "Seed User Gamma", email: "seed.gamma@yahoo.com.br", phone: "+5531999990003" },
  { name: "Seed User Delta", email: "seed.delta@outlook.com", phone: "+5541999990004" },
];

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const teams = await db
    .select({ id: teamsSchema.id, name: teamsSchema.name, status: teamsSchema.status })
    .from(teamsSchema);

  const activeTeams = teams.filter((t) => t.status === "active");

  if (activeTeams.length === 0) {
    console.error("No active teams found. Make sure at least some teams have status 'active'.");
    console.log("Available teams:", teams.map((t) => `${t.name} (${t.status})`).join(", "));
    process.exitCode = 1;
    return;
  }

  console.log(`Found ${activeTeams.length} active teams. Creating 4 votes via use case...\n`);

  for (let i = 0; i < VOTERS.length; i++) {
    const voter = VOTERS[i]!;
    const testIp = TEST_IPS[i]!;
    const team = activeTeams[i % activeTeams.length]!;
    const tokenCode = `${String(i + 1).padStart(6, "0")}`;
    const tokenHash = sha256(tokenCode);

    console.log(`--- Vote ${i + 1}: ${voter.name} → ${team.name} | IP: ${testIp.ip} (${testIp.label}) ---`);

    const [user] = await db
      .insert(usersSchema)
      .values({
        name: voter.name,
        email: voter.email,
        normalizedEmail: normalizeEmail(voter.email),
        role: "user",
      })
      .onConflictDoNothing()
      .returning({ id: usersSchema.id });

    if (!user) {
      console.log(`  Skipped: email ${voter.email} already exists.\n`);
      continue;
    }

    console.log(`  User created: ${user.id}`);

    const [token] = await db
      .insert(votesTokensSchema)
      .values({
        userId: user.id,
        tokenHash,
        phoneNumber: voter.phone,
        ipAddress: testIp.ip,
        channel: "whatsapp",
        status: "valid",
        attempts: 0,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      })
      .returning({ id: votesTokensSchema.id });

    console.log(`  Token created: ${token!.id} (code: ${tokenCode})`);

    try {
      const result = await voteForTimeByIdUseCase({
        userId: user.id,
        teamId: team.id,
        token: tokenCode,
        ipAddress: testIp.ip,
        fingerprint: `seed-fingerprint-${i}`,
        userAgent: "SeedScript/1.0",
        metadata: { seed: true },
      });
      console.log(`  Vote result: ${result.message}`);
    } catch (err: any) {
      console.error(`  Vote failed: ${err.message}`);
    }

    console.log();
  }

  console.log("=== Dashboard Output ===\n");
  const dashboard = await votesDashboardUseCase();

  console.log("Totals:", JSON.stringify(dashboard.totals, null, 2));
  console.log("\nPer Team:");
  for (const t of dashboard.perTeam) {
    console.log(`  ${t.teamName}: ${t.valid} valid, ${t.flagged} flagged, ${t.total} total`);
  }
  console.log("\nRecent votes (last 20):");
  for (const v of dashboard.recent) {
    console.log(`  [${v.status}] ${v.userName} → ${v.teamName} via ${v.channel} (${v.createdAt.toISOString()})`);
  }
}

main()
  .catch((error) => {
    console.error("Seed votes failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await shutdownPools();
  });
