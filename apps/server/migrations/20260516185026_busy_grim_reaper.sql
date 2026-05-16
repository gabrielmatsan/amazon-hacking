ALTER TABLE "votes" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "team_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "votes_user_id_unique" ON "votes" USING btree ("user_id");