-- Create a temporary column to hold the converted values
ALTER TABLE "public"."tasks" ADD COLUMN "status_temp" INTEGER;

-- Convert existing enum values to integers
UPDATE "public"."tasks" SET "status_temp" = CASE
  WHEN status::text = 'TODO' THEN 1
  WHEN status::text = 'IN_PROGRESS' THEN 2
  WHEN status::text = 'DONE' THEN 3
  ELSE 1 -- Default to TODO if unknown
END;

-- Drop the old column
ALTER TABLE "public"."tasks" DROP COLUMN "status";

-- Rename the temporary column to the original name
ALTER TABLE "public"."tasks" RENAME COLUMN "status_temp" TO "status";

-- Set default value
ALTER TABLE "public"."tasks" ALTER COLUMN "status" SET DEFAULT 1;

-- Drop the enum
DROP TYPE "public"."Status";
