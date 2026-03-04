-- Add 'deleted' status to open_request_items
ALTER TYPE "open_request_status" ADD VALUE IF NOT EXISTS 'deleted';

-- Add deleted_at for archive/reporting
ALTER TABLE "open_request_items" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
