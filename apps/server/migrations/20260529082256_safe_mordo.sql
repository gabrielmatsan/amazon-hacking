CREATE TYPE "public"."solution_pillar" AS ENUM('digital_agriculture', 'bioeconomy', 'logistics', 'education', 'health', 'default');--> statement-breakpoint
CREATE TYPE "public"."team_audit_action" AS ENUM('approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."team_status" AS ENUM('active', 'review', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_roles" AS ENUM('user', 'mentor', 'admin', 'leader');--> statement-breakpoint
CREATE TYPE "public"."vote_token_channel" AS ENUM('whatsapp', 'email');--> statement-breakpoint
CREATE TYPE "public"."vote_token_status" AS ENUM('valid', 'used', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."vote_sources" AS ENUM('user', 'mentor');--> statement-breakpoint
CREATE TYPE "public"."vote_status" AS ENUM('valid', 'flagged', 'invalidated');--> statement-breakpoint
CREATE TABLE "app_config" (
	"id" varchar(34) PRIMARY KEY NOT NULL,
	"voting_starts_at" timestamp with time zone,
	"voting_ends_at" timestamp with time zone,
	"voting_enabled" boolean DEFAULT true NOT NULL,
	"max_risk_score" integer DEFAULT 100 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team_audit_logs" (
	"id" varchar(34) PRIMARY KEY NOT NULL,
	"team_id" varchar(34) NOT NULL,
	"action" "team_audit_action" NOT NULL,
	"performed_by" varchar(34) NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" varchar(34) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(500),
	"logo_url" text,
	"slug" varchar(255) NOT NULL,
	"team_members" jsonb,
	"solution_pillar" "solution_pillar" DEFAULT 'default' NOT NULL,
	"status" "team_status" DEFAULT 'review' NOT NULL,
	"rejection_reason" text,
	"video_url" varchar(500),
	"secondary_video_url" varchar(500),
	"created_by" varchar(34),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(34) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"team_id" varchar(34),
	"normalized_email" varchar(255) NOT NULL,
	"role" "user_roles" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "votes_tokens" (
	"id" varchar(34) PRIMARY KEY NOT NULL,
	"user_id" varchar(34) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"phone_number" varchar(20),
	"ip_address" varchar(45),
	"channel" "vote_token_channel" DEFAULT 'whatsapp' NOT NULL,
	"status" "vote_token_status" DEFAULT 'valid' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" varchar(34) PRIMARY KEY NOT NULL,
	"user_id" varchar(34) NOT NULL,
	"team_id" varchar(34) NOT NULL,
	"phone_number" varchar(20),
	"channel" "vote_token_channel" DEFAULT 'whatsapp' NOT NULL,
	"status" "vote_status" DEFAULT 'valid' NOT NULL,
	"ip_address" text,
	"ip_country" text,
	"user_agent" text,
	"fingerprint" varchar(64),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "votes_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "team_audit_logs" ADD CONSTRAINT "team_audit_logs_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_audit_logs" ADD CONSTRAINT "team_audit_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes_tokens" ADD CONSTRAINT "votes_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "votes_tokens_user_id_valid_unique" ON "votes_tokens" USING btree ("user_id") WHERE "votes_tokens"."status" = 'valid';--> statement-breakpoint
CREATE INDEX "votes_tokens_phone_number_index" ON "votes_tokens" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "votes_tokens_user_id_index" ON "votes_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "votes_tokens_ip_address_index" ON "votes_tokens" USING btree ("ip_address");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_user_id_unique" ON "votes" USING btree ("user_id");