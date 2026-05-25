import { db } from "../src/shared/infra/databases/postgres";
import { normalizeEmail } from "../src/shared/utils/normalize-email";
import { usersSchema } from "../src/users/domain/users.schema";
import { VotesRepository } from "../src/votes/infra/votes.repository";

async function main() {
  console.log("=== Teste: contagem de votos por email normalizado ===\n");

  const users = await db
    .select({ id: usersSchema.id, email: usersSchema.email, normalizedEmail: usersSchema.normalizedEmail })
    .from(usersSchema);

  console.log(`Users no banco: ${users.length}\n`);

  for (const user of users) {
    const normalized = normalizeEmail(user.email);
    const count = await VotesRepository.countByNormalizedEmail(normalized);

    console.log(`  ${user.email}`);
    console.log(`    normalized: ${normalized}`);
    console.log(`    db stored:  ${user.normalizedEmail}`);
    console.log(`    match:      ${normalized === user.normalizedEmail ? "✓" : "✗ MISMATCH"}`);
    console.log(`    votes:      ${count}/5`);
    console.log();
  }

  // Teste com variações de Gmail que devem mapear pro mesmo normalizado
  const gmailVariations = [
    "gabrielm4rtelo@gmail.com",
    "g.a.b.r.i.e.l.m.4.r.t.e.l.o@gmail.com",
    "gabrielm4rtelo+test1@gmail.com",
    "gabrielm4rtelo+test2@gmail.com",
    "GabrielM4rtelo@Gmail.COM",
  ];

  console.log("--- Gmail variations (devem normalizar igual) ---\n");
  const normalized = new Set<string>();
  for (const email of gmailVariations) {
    const n = normalizeEmail(email);
    normalized.add(n);
    console.log(`  ${email} → ${n}`);
  }
  console.log(`\n  Unique normalized: ${normalized.size} (expected: 1)`);
  console.log(`  Result: ${normalized.size === 1 ? "✓ PASS" : "✗ FAIL"}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
