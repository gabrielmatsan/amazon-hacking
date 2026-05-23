CREATE TYPE "public"."vote_token_status" AS ENUM('valid', 'used', 'superseded');--> statement-breakpoint
CREATE TABLE "votes_tokens" (
	"id" varchar(34) PRIMARY KEY NOT NULL,
	"user_id" varchar(34) NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"status" "vote_token_status" DEFAULT 'valid' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "phone_number" varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE "votes_tokens" ADD CONSTRAINT "votes_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "votes_tokens_user_id_valid_unique" ON "votes_tokens" USING btree ("user_id") WHERE "votes_tokens"."status" = 'valid';--> statement-breakpoint
CREATE INDEX "votes_tokens_phone_number_index" ON "votes_tokens" USING btree ("phone_number");--> statement-breakpoint
CREATE INDEX "votes_tokens_user_id_index" ON "votes_tokens" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_phone_number_unique" UNIQUE("phone_number");