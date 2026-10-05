ALTER TYPE "TaskNotificationType" ADD VALUE 'TASK_DUE_SOON';
ALTER TYPE "TaskNotificationType" ADD VALUE 'TASK_OVERDUE';

ALTER TABLE "task_notifications"
ADD COLUMN "dedupeKey" TEXT;

CREATE UNIQUE INDEX "task_notifications_taskId_recipientId_type_dedupeKey_key"
ON "task_notifications"("taskId", "recipientId", "type", "dedupeKey");

CREATE INDEX "tasks_archivedAt_status_dueAt_id_idx"
ON "tasks"("archivedAt", "status", "dueAt", "id");
