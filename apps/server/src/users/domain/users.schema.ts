import { votesSchema } from "@/votes/domain/votes.schema";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";


export const userRoles = pgEnum("user_roles", ["user", "mentor", "admin"]);

export const usersSchema = pgTable("users", {
  id: varchar("id", { length: 34 }).primaryKey().$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: userRoles("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})


export const usersRelations = relations(usersSchema, ({ many }) => ({
  votes: many(votesSchema),
}))

export type NewUser = typeof usersSchema.$inferInsert;