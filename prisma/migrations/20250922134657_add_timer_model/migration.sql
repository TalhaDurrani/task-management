-- CreateTable
CREATE TABLE "public"."timers" (
    "id" UUID NOT NULL,
    "taskId" UUID,
    "userId" UUID,
    "description" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "elapsedTime" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."timers" ADD CONSTRAINT "timers_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."timers" ADD CONSTRAINT "timers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
