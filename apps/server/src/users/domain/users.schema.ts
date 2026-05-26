import { normalizeEmail } from "@/shared/utils/normalize-email";
import { teamsSchema } from "@/teams/domain/teams.schema";
import { votesSchema } from "@/votes/domain/votes.schema";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";


export const userRoles = pgEnum("user_roles", ["user", "mentor", "admin", "leader"]);

export const usersSchema = pgTable("users", {
  id: varchar("id", { length: 34 }).primaryKey().$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  teamId: varchar("team_id", { length: 34 }).references(() => teamsSchema.id),
  normalizedEmail: varchar("normalized_email", { length: 255 }).notNull(),
  role: userRoles("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})


export const usersRelations = relations(usersSchema, ({ many, one }) => ({
  votes: many(votesSchema),
  team: one(teamsSchema, {
    fields: [usersSchema.teamId],
    references: [teamsSchema.id],
  }),
}))

export type NewUser = typeof usersSchema.$inferInsert;