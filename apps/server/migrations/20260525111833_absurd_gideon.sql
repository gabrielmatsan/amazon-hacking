ALTER TABLE "votes_tokens" ADD COLUMN "ip_address" varchar(45);--> statement-breakpoint
CREATE INDEX "votes_tokens_ip_address_index" ON "votes_tokens" USING btree ("ip_address");