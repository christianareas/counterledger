ALTER TABLE "users" RENAME COLUMN "name" TO "full_name";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "middle_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text NOT NULL;