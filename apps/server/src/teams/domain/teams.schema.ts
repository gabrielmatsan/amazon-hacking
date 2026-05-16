import { votesSchema } from "@/votes/domain/votes.schema";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export type TeamMember = {
  name: string;
  role: string;
  email?: string;
  imageUrl?: string;
  links?: {
    website?: string;
    linkedin?: string;
    github?: string;
  }
}

export const teamsSchema = pgTable("teams", {
  id: varchar("id", { length: 34 }).primaryKey().$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  teamMembers: jsonb("team_members").$type<TeamMember[]>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const teamsRelations = relations(teamsSchema, ({ many }) => ({
  votes: many(votesSchema),
}))