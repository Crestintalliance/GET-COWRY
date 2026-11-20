CREATE TABLE "suggestions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"country_code" text NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"area" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"submitted_by" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
