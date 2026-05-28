import { usersSchema } from "@/users/domain/users.schema";
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

export const teamStatusEnum = pgEnum("team_status", ["active", "review", "rejected"]);

export const teamAuditActionEnum = pgEnum("team_audit_action", ["approved", "rejected"]);

export const teamsSchema = pgTable("teams", {
  id: varchar("id", { length: 34 }).primaryKey().$defaultFn(() => createId()),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 500 }),
  logoUrl: text("logo_url"),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  teamMembers: jsonb("team_members").$type<TeamMember[]>(),
  solutionPillar: solutionPillarEnum("solution_pillar").notNull().default("default"),
  status: teamStatusEnum("status").notNull().default("review"),
  rejectionReason: text("rejection_reason"),
  videoUrl: varchar("video_url", { length: 500 }),
  secondaryVideoUrl: varchar("secondary_video_url", { length: 500 }),
  createdBy: varchar("created_by", { length: 34 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const teamAuditLogsSchema = pgTable("team_audit_logs", {
  id: varchar("id", { length: 34 }).primaryKey().$defaultFn(() => createId()),
  teamId: varchar("team_id", { length: 34 }).notNull().references(() => teamsSchema.id),
  action: teamAuditActionEnum("action").notNull(),
  performedBy: varchar("performed_by", { length: 34 }).notNull().references(() => usersSchema.id),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const teamsRelations = relations(teamsSchema, ({ many, one }) => ({
  votes: many(votesSchema),
  users: many(usersSchema),
  creator: one(usersSchema, {
    fields: [teamsSchema.createdBy],
    references: [usersSchema.id],
  }),
  auditLogs: many(teamAuditLogsSchema),
}))

export const teamAuditLogsRelations = relations(teamAuditLogsSchema, ({ one }) => ({
  team: one(teamsSchema, {
    fields: [teamAuditLogsSchema.teamId],
    references: [teamsSchema.id],
  }),
  performer: one(usersSchema, {
    fields: [teamAuditLogsSchema.performedBy],
    references: [usersSchema.id],
  }),
}))

export type NewTeam = typeof teamsSchema.$inferInsert;
export type NewTeamAuditLog = typeof teamAuditLogsSchema.$inferInsert;
