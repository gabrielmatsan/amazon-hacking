import { teamsSchema } from "@/teams/domain/teams.schema";
import { usersSchema } from "@/users/domain/users.schema";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

// marcar se voto veio de um usuário ou de um mentor
export const voteSources = pgEnum("vote_sources", ["user", "mentor"]);
export const voteStatus = pgEnum("vote_status", ["valid", "flagged", "invalidated"]);

export const votesSchema = pgTable(
  "votes",
  {
    id: varchar("id", { length: 34 }).primaryKey().$defaultFn(() => createId()),

    userId: varchar("user_id", { length: 34 }).references(() => usersSchema.id).notNull(),
    teamId: varchar("team_id", { length: 34 }).references(() => teamsSchema.id).notNull(),

    status: voteStatus("status").notNull().default("valid"),

    ipAddress: text("ip_address"),
    ipCountry: text("ip_country"),
    userAgent: text("user_agent"),
    //fingerprint: varchar("fingerprint", { length: 64 }),

    metadata: jsonb("metadata").$type<any>(),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("votes_user_id_unique").on(table.userId),
  ],
)


export const votesRelations = relations(votesSchema, ({ one }) => ({
  user: one(usersSchema, {
    fields: [votesSchema.userId],
    references: [usersSchema.id],
  }),
  team: one(teamsSchema, {
    fields: [votesSchema.teamId],
    references: [teamsSchema.id],
  }),
}))

export type NewVote = typeof votesSchema.$inferInsert;
