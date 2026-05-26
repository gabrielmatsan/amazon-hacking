CREATE TYPE "public"."team_status" AS ENUM('active', 'review', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."user_roles" ADD VALUE 'leader';--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "status" "team_status" DEFAULT 'review' NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "team_id" varchar(34);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;