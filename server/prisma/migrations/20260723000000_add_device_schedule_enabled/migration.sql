-- T5: Add `enabled` column to `device_schedules` for per-device on/off toggle
-- in the publish flow.
--
-- Run on production BEFORE deploying server:
--   psql $DATABASE_URL -f migrations/20260723000000_add_device_schedule_enabled/migration.sql
-- or via Prisma:
--   npx prisma migrate deploy
--
-- Safe to run multiple times (uses IF NOT EXISTS).

ALTER TABLE "device_schedules"
  ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;

-- Index for fast lookup of enabled device-schedule pairs
CREATE INDEX IF NOT EXISTS "device_schedules_enabled_idx"
  ON "device_schedules" ("enabled")
  WHERE "enabled" = true;
