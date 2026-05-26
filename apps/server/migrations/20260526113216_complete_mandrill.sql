CREATE TABLE "app_config" (
	"id" varchar(34) PRIMARY KEY NOT NULL,
	"voting_starts_at" timestamp with time zone,
	"voting_ends_at" timestamp with time zone,
	"voting_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
