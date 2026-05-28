CREATE TYPE "public"."team_audit_action" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TABLE "team_audit_logs" (
	"id" varchar(34) PRIMARY KEY NOT NULL,
	"team_id" varchar(34) NOT NULL,
	"action" "team_audit_action" NOT NULL,
	"performed_by" varchar(34) NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "created_by" varchar(34);--> statement-breakpoint
ALTER TABLE "team_audit_logs" ADD CONSTRAINT "team_audit_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_audit_logs" ADD CONSTRAINT "team_audit_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;