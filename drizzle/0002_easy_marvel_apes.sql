ALTER TABLE "open_requests" ALTER COLUMN "requester_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "show_open_request_button" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "open_requests" ADD COLUMN "requester_name" text;--> statement-breakpoint
ALTER TABLE "open_requests" ADD COLUMN "requester_phone" text;--> statement-breakpoint
ALTER TABLE "open_requests" ADD COLUMN "source" text;