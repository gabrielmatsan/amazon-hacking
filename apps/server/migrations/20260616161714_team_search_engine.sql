CREATE EXTENSION IF NOT EXISTS unaccent;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint

CREATE OR REPLACE FUNCTION immutable_unaccent(text)
RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;--> statement-breakpoint

ALTER TABLE "teams" ADD COLUMN "search_vector" tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('portuguese', immutable_unaccent(coalesce("name", ''))), 'A') ||
  setweight(to_tsvector('portuguese', immutable_unaccent(coalesce("description", ''))), 'B')
) STORED;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "teams_search_vector_idx" ON "teams" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "teams_name_trgm_idx" ON "teams" USING gin (immutable_unaccent("name") gin_trgm_ops);
