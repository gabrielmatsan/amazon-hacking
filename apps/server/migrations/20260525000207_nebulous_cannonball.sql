CREATE TYPE "public"."vote_token_channel" AS ENUM('whatsapp', 'email');--> statement-breakpoint
ALTER TABLE "votes_tokens" ALTER COLUMN "phone_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "phone_number" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "votes_tokens" ADD COLUMN "channel" "vote_token_channel" DEFAULT 'whatsapp' NOT NULL;--> statement-breakpoint
ALTER TABLE "votes" ADD COLUMN "channel" "vote_token_channel" DEFAULT 'whatsapp' NOT NULL;