import { createId } from "@paralleldrive/cuid2";
import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const appConfigSchema = pgTable("app_config", {
  id: varchar("id", { length: 34 }).primaryKey().$defaultFn(() => createId()),
  votingStartsAt: timestamp("voting_starts_at", { withTimezone: true }),
  votingEndsAt: timestamp("voting_ends_at", { withTimezone: true }),
  votingEnabled: boolean("voting_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type AppConfig = typeof appConfigSchema.$inferSelect;
export type NewAppConfig = typeof appConfigSchema.$inferInsert;
