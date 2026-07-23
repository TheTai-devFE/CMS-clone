-- T6: Add purchaseType to User + LicenseAudit table
--
-- Run on production BEFORE deploying server:
--   psql $DATABASE_URL -f migrations/20260723000000_add_user_purchase_type_and_audit/migration.sql
-- or via Prisma:
--   npx prisma migrate deploy
--
-- Safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- 1. Add purchase_type column to users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "purchase_type" VARCHAR(20);

-- 2. Create license_audits table
CREATE TABLE IF NOT EXISTS "license_audits" (
  "id"           UUID         NOT NULL,
  "user_id"      UUID         NOT NULL,
  "changed_by_id" UUID,
  "action"       VARCHAR(30)  NOT NULL,
  "old_value"    VARCHAR(255),
  "new_value"    VARCHAR(255) NOT NULL,
  "note"         VARCHAR(500),
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "license_audits_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'license_audits_user_id_fkey'
  ) THEN
    ALTER TABLE "license_audits"
      ADD CONSTRAINT "license_audits_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS "license_audits_user_id_created_at_idx"
  ON "license_audits" ("user_id", "created_at");
