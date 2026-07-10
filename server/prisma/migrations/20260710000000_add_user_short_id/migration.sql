-- Add shortId column to users table
ALTER TABLE "users" ADD COLUMN "short_id" VARCHAR(20);

-- Generate shortId for existing users based on their creation order
WITH numbered_users AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM "users"
)
UPDATE "users"
SET short_id = 'USR-' || LPAD(nu.row_num::text, 4, '0')
FROM numbered_users nu
WHERE "users".id = nu.id;

-- Make shortId NOT NULL and add unique constraint
ALTER TABLE "users" ALTER COLUMN "short_id" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_short_id_key" UNIQUE ("short_id");
