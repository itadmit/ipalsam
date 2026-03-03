ALTER TABLE "open_requests" ADD COLUMN "handover_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;
