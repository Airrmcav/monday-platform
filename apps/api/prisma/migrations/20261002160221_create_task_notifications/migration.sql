-- CreateEnum
CREATE TYPE "TaskNotificationType" AS ENUM ('TASK_ASSIGNED', 'TASK_STATUS_CHANGED', 'TASK_BLOCKED', 'TASK_UNBLOCKED', 'TASK_COMMENTED');

-- CreateTable
CREATE TABLE "task_notifications" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "actorId" UUID,
    "actorName" TEXT,
    "type" "TaskNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_notifications_recipientId_readAt_createdAt_id_idx" ON "task_notifications"("recipientId", "readAt", "createdAt", "id");

-- CreateIndex
CREATE INDEX "task_notifications_taskId_createdAt_id_idx" ON "task_notifications"("taskId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "task_notifications_actorId_idx" ON "task_notifications"("actorId");

-- AddForeignKey
ALTER TABLE "task_notifications" ADD CONSTRAINT "task_notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_notifications" ADD CONSTRAINT "task_notifications_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_notifications" ADD CONSTRAINT "task_notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
