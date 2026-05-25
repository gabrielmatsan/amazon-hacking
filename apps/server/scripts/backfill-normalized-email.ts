import { db } from "../src/shared/infra/databases/postgres";
import { normalizeEmail } from "../src/shared/utils/normalize-email";
import { usersSchema } from "../src/users/domain/users.schema";
import { eq } from "drizzle-orm";

async function main() {
  const users = await db.select({ id: usersSchema.id, email: usersSchema.email }).from(usersSchema);

  console.log(`Found ${users.length} users to backfill\n`);

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const normalized = normalizeEmail(user.email);

    await db
      .update(usersSchema)
      .set({ normalizedEmail: normalized })
      .where(eq(usersSchema.id, user.id));

    console.log(`  ${user.email} → ${normalized}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
