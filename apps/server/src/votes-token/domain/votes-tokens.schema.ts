import { usersSchema } from "@/users/domain/users.schema";
import { createId } from "@paralleldrive/cuid2";
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const voteTokenStatus = pgEnum("vote_token_status", [
  "valid",
  "used",
  "superseded",
]);

export const voteTokenChannel = pgEnum("vote_token_channel", [
  "whatsapp",
  "email",
  "sms",
]);

export const votesTokensSchema = pgTable(
  "votes_tokens",
  {
    id: varchar("id", { length: 34 }).primaryKey().$defaultFn(() => createId()),
    userId: varchar("user_id", { length: 34 })
      .references(() => usersSchema.id)
      .notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 20 }),
    ipAddress: varchar("ip_address", { length: 45 }),
    channel: voteTokenChannel("channel").notNull().default("whatsapp"),
    status: voteTokenStatus("status").notNull().default("valid"),
    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("votes_tokens_user_id_valid_unique")
      .on(table.userId)
      .where(sql`${table.status} = 'valid'`),
    index("votes_tokens_phone_number_index").on(table.phoneNumber),
    index("votes_tokens_user_id_index").on(table.userId),
    index("votes_tokens_ip_address_index").on(table.ipAddress),
  ],
);

export const votesTokensRelations = relations(votesTokensSchema, ({ one }) => ({
  user: one(usersSchema, {
    fields: [votesTokensSchema.userId],
    references: [usersSchema.id],
  }),
}));

export type NewVoteTokenInput = typeof votesTokensSchema.$inferInsert;
export type VoteTokenRow = typeof votesTokensSchema.$inferSelect;
