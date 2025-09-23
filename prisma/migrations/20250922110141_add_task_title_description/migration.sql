-- Add title and description columns as nullable first
ALTER TABLE "public"."tasks" ADD COLUMN "description" TEXT;
ALTER TABLE "public"."tasks" ADD COLUMN "title" TEXT;

-- Update existing tasks to have a default title based on their label
UPDATE "public"."tasks" SET "title" = COALESCE("label", 'Untitled Task') WHERE "title" IS NULL;

-- Now make title required
ALTER TABLE "public"."tasks" ALTER COLUMN "title" SET NOT NULL;
