-- CreateEnum
CREATE TYPE "TaskHistoryAction" AS ENUM ('CREATED', 'UPDATED', 'STATUS_CHANGED', 'BLOCKED', 'UNBLOCKED', 'BLOCK_REASON_CHANGED');

-- CreateTable
CREATE TABLE "task_history_entries" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "actorName" TEXT NOT NULL,
    "action" "TaskHistoryAction" NOT NULL,
    "changes" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_history_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_history_entries_taskId_createdAt_id_idx" ON "task_history_entries"("taskId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "task_history_entries_actorId_idx" ON "task_history_entries"("actorId");

-- AddForeignKey
ALTER TABLE "task_history_entries" ADD CONSTRAINT "task_history_entries_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_history_entries" ADD CONSTRAINT "task_history_entries_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
