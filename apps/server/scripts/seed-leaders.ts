import { resolve } from "node:path";

import { inArray } from "drizzle-orm";
import * as XLSX from "xlsx";

import { db, shutdownPools } from "../src/shared/infra/databases/postgres";
import { normalizeEmail } from "../src/shared/utils/normalize-email";
import { type NewUser, usersSchema } from "../src/users/domain/users.schema";

const EXCEL_PATH = resolve(import.meta.dir, "../excels/lideres-ah.xlsx");

type LeaderRow = {
  name: string;
  email: string;
};

function readLeadersFromExcel(path: string): LeaderRow[] {
  const workbook = XLSX.readFile(path);
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error(`No sheets found in ${path}`);
  }

  const sheet = workbook.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return rows
    .map((row) => ({
      name: String(row.name ?? "").trim(),
      email: String(row.email ?? "").trim(),
    }))
    .filter((row) => row.name.length > 0 && row.email.length > 0);
}

async function main() {
  const rawLeaders = readLeadersFromExcel(EXCEL_PATH);
  console.log(`Read ${rawLeaders.length} leader(s) from ${EXCEL_PATH}`);

  // Dedup por email normalizado dentro do proprio arquivo.
  const byNormalized = new Map<string, NewUser>();
  for (const leader of rawLeaders) {
    const normalizedEmail = normalizeEmail(leader.email);
    if (!byNormalized.has(normalizedEmail)) {
      byNormalized.set(normalizedEmail, {
        name: leader.name,
        email: leader.email.trim().toLowerCase(),
        normalizedEmail,
        role: "leader",
        // Lideres sao cadastrados sem equipe (teamId fica null).
      });
    }
  }

  const leaders = [...byNormalized.values()];

  await db.transaction(async (tx) => {
    const emails = leaders.map((leader) => leader.email);

    const existing = await tx
      .select({ email: usersSchema.email })
      .from(usersSchema)
      .where(inArray(usersSchema.email, emails));

    const existingEmails = new Set(existing.map((user) => user.email));
    const toInsert = leaders.filter((leader) => !existingEmails.has(leader.email));

    if (toInsert.length === 0) {
      console.log("Seed leaders: nothing to insert. All leaders already exist.");
      return;
    }

    const inserted = await tx
      .insert(usersSchema)
      .values(toInsert)
      .onConflictDoNothing({ target: usersSchema.email })
      .returning({
        id: usersSchema.id,
        name: usersSchema.name,
        email: usersSchema.email,
        role: usersSchema.role,
      });

    console.log(`Seed leaders: inserted ${inserted.length} leader(s) as role "leader".`);
    for (const leader of inserted) {
      console.log(`- ${leader.name} <${leader.email}> (${leader.id})`);
    }

    const skipped = leaders.length - inserted.length;
    if (skipped > 0) {
      console.log(`Skipped ${skipped} leader(s) that already existed.`);
    }
  });
}

main()
  .catch((error) => {
    console.error("Seed leaders failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await shutdownPools();
  });
