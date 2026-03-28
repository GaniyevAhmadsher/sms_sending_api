-- Add payment canceled status
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

-- Create webhook status enum
DO $$ BEGIN
  CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'QUEUED', 'RETRYING', 'PROCESSED', 'DEAD_LETTER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "WebhookEvent" (
  "id" TEXT PRIMARY KEY,
  "provider" "PaymentProvider" NOT NULL,
  "dedupeKey" TEXT NOT NULL UNIQUE,
  "externalId" TEXT NOT NULL,
  "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "payload" JSONB NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "WebhookEvent_provider_createdAt_idx" ON "WebhookEvent"("provider", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "WebhookEvent_status_createdAt_idx" ON "WebhookEvent"("status", "createdAt" DESC);
