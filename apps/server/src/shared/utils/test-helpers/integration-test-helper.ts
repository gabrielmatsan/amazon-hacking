import type { Transaction } from "@/shared/infra/databases/postgres";
import { db } from "@/shared/infra/databases/postgres";
import { faker } from "@faker-js/faker";
import { sql } from "drizzle-orm";
import path from "path";
import fs from "fs";

export class IntegrationTestHelper {
  static async clearDatabase(): Promise<void> {
    try {
      await db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`);
      await db.execute(sql`CREATE SCHEMA public`);
      await db.execute(sql`GRANT ALL ON SCHEMA public TO public`);
      await db.execute(sql`SET search_path TO public`);
    } catch (error) {
      console.error("Error clearing test database:", error);
      throw error;
    }
  }

  static async runMigrations(): Promise<void> {
    try {
      const cwd = process.cwd();
      const migrationsFolder = fs.existsSync(path.join(cwd, "migrations"))
        ? path.join(cwd, "migrations")
        : path.join(cwd, "apps/server/migrations");

      const files = fs.readdirSync(migrationsFolder).filter((f) => f.endsWith(".sql")).sort();

      let allSQL = "SET search_path TO public;\n";

      for (const file of files) {
        const filePath = path.join(migrationsFolder, file);
        const migrationSQL = fs.readFileSync(filePath, "utf-8");
        const cleanSQL = migrationSQL.replace(/--> statement-breakpoint\s*/g, "\n");
        allSQL += `\n-- ${file}\n${cleanSQL}\n`;
      }

      await db.execute(sql.raw(allSQL));
    } catch (error) {
      console.error("Error running migrations:", error);
      throw error;
    }
  }

  static async resetDatabase(): Promise<void> {
    await this.clearDatabase();
    await this.runMigrations();
  }

  static async setupTestDatabase(): Promise<void> {
    await this.resetDatabase();
  }

  static generateTestEmail(): string {
    return `test-${faker.string.alphanumeric(10)}@example.com`;
  }

  static generateTestPassword(): string {
    return faker.internet.password({ length: 8, memorable: false });
  }

  static async runInTransaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    return await db.transaction(async (tx) => {
      return await callback(tx);
    });
  }
}
