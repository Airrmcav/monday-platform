-- CreateEnum
CREATE TYPE "MeetingReminderType" AS ENUM ('DAY_BEFORE', 'SAME_DAY');

-- CreateTable
CREATE TABLE "meeting_notifications" (
    "id" UUID NOT NULL,
    "meetingId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "type" "MeetingReminderType" NOT NULL,
    "scheduledFor" TIMESTAMPTZ(3) NOT NULL,
    "sentAt" TIMESTAMPTZ(3),
    "readAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meeting_notifications_meetingId_recipientId_type_scheduledF_key"
ON "meeting_notifications"("meetingId", "recipientId", "type", "scheduledFor");

-- CreateIndex
CREATE INDEX "meeting_notifications_recipientId_sentAt_readAt_createdAt_idx"
ON "meeting_notifications"("recipientId", "sentAt", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "meeting_notifications_sentAt_scheduledFor_idx"
ON "meeting_notifications"("sentAt", "scheduledFor");

-- AddForeignKey
ALTER TABLE "meeting_notifications"
ADD CONSTRAINT "meeting_notifications_meetingId_fkey"
FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_notifications"
ADD CONSTRAINT "meeting_notifications_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "app_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
