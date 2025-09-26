-- CreateEnum
CREATE TYPE "public"."StatusCategory" AS ENUM ('BACKLOG', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD');

-- AlterTable
ALTER TABLE "public"."tasks" ADD COLUMN     "customStatus" TEXT,
ADD COLUMN     "statusCategory" "public"."StatusCategory" NOT NULL DEFAULT 'BACKLOG';
