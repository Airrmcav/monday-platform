-- CreateEnum
CREATE TYPE "TaskAttachmentStatus" AS ENUM ('PENDING', 'ATTACHED');

-- CreateTable
CREATE TABLE "task_attachments" (
  "id" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "commentId" UUID,
  "uploadedById" UUID NOT NULL,
  "uploadedByName" TEXT NOT NULL,
  "status" "TaskAttachmentStatus" NOT NULL DEFAULT 'PENDING',
  "storagePath" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "expiresAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "task_attachments_pkey" PRIMARY KEY ("id"),

  CONSTRAINT "task_attachments_state_check" CHECK (
    (
      "status" = 'PENDING'
      AND "commentId" IS NULL
      AND "expiresAt" IS NOT NULL
    )
    OR
    (
      "status" = 'ATTACHED'
      AND "commentId" IS NOT NULL
      AND "expiresAt" IS NULL
    )
  )
);

-- CreateIndex
CREATE UNIQUE INDEX "task_attachments_storagePath_key"
ON "task_attachments"("storagePath");

-- CreateIndex
CREATE INDEX "task_attachments_taskId_status_expiresAt_idx"
ON "task_attachments"("taskId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "task_attachments_commentId_idx"
ON "task_attachments"("commentId");

-- CreateIndex
CREATE INDEX "task_attachments_uploadedById_idx"
ON "task_attachments"("uploadedById");

-- AddForeignKey
ALTER TABLE "task_attachments"
ADD CONSTRAINT "task_attachments_taskId_fkey"
FOREIGN KEY ("taskId")
REFERENCES "tasks"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments"
ADD CONSTRAINT "task_attachments_commentId_fkey"
FOREIGN KEY ("commentId")
REFERENCES "task_comments"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_attachments"
ADD CONSTRAINT "task_attachments_uploadedById_fkey"
FOREIGN KEY ("uploadedById")
REFERENCES "app_users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;