import type { ExtractTablesWithRelations } from "drizzle-orm";
import { drizzle, NodePgDatabase, type NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { env } from "../env/env";

export type Transaction = PgTransaction<
  NodePgQueryResultHKT,
  Record<string, never>,
  ExtractTablesWithRelations<Record<string, never>>
>;

type DbInstanceType = NodePgDatabase<Record<string, never>>;

let db: DbInstanceType;

const activePools: Pool[] = [];

switch (env.NODE_ENV) {
  case "production":
  case "development":
  case "test":
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL is not set");
    }

    const connectionString = env.DATABASE_URL.includes('sslmode=')
      ? env.DATABASE_URL
      : `${env.DATABASE_URL}?sslmode=require`;

    const devDb = new Pool({
      connectionString: connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      query_timeout: 30000,
    });

    activePools.push(devDb);

    db = drizzle(devDb);
    break;
  default:
    throw new Error("Invalid NODE_ENV");
}

let isShuttingDown = false;

async function shutdownPools(): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;

  for (const pool of activePools) {
    try {
      await pool.end();
    } catch (err) {
      if (err instanceof Error && !err.message.includes("more than once")) {
        console.error("Error closing pool:", err);
      }
    }
  }
}

export { db, shutdownPools };
