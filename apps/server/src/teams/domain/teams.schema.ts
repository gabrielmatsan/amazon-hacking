import { votesSchema } from "@/votes/domain/votes.schema";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { jsonb, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import type { TeamMember } from "./teams.type";


export const solutionPillarEnum = pgEnum("solution_pillar", [
  "digital_agriculture",
  "bioeconomy",
  "logistics",
  "education",
  "health",
  "default"
]);
export const teamsSchema = pgTable("teams", {
  id: varchar("id", { length: 34 }).primaryKey().$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  teamMembers: jsonb("team_members").$type<TeamMember[]>(),
  solutionPillar: solutionPillarEnum("solution_pillar").notNull().default("default"),
  videoUrl: varchar("video_url", { length: 500 }),
  secondaryVideoUrl: varchar("secondary_video_url", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const teamsRelations = relations(teamsSchema, ({ many }) => ({
  votes: many(votesSchema),
}))


export type NewTeam = typeof teamsSchema.$inferInsert;
