import { defineConfig } from "drizzle-kit";
import { env } from "./src/shared/infra/env/env";

export default defineConfig({
  schema: "./src/**/*.schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  migrations: {
    prefix: 'timestamp',
  }
});
