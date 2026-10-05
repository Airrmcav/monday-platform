-- CreateTable
CREATE TABLE "task_comments" (
  "id" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "authorId" UUID NOT NULL,
  "authorName" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_comments_taskId_createdAt_id_idx"
ON "task_comments"("taskId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "task_comments_authorId_idx"
ON "task_comments"("authorId");

-- AddForeignKey
ALTER TABLE "task_comments"
ADD CONSTRAINT "task_comments_taskId_fkey"
FOREIGN KEY ("taskId")
REFERENCES "tasks"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_comments"
ADD CONSTRAINT "task_comments_authorId_fkey"
FOREIGN KEY ("authorId")
REFERENCES "app_users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;