ALTER TABLE "teams" ADD COLUMN "slug" varchar(255);--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_slug_unique" UNIQUE("slug");