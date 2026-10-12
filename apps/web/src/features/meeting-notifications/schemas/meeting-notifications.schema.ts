import { z } from "zod";

export const meetingNotificationSchema = z.strictObject({
  id: z.uuid(),
  type: z.enum(["DAY_BEFORE", "SAME_DAY"]),
  readAt: z.iso.datetime({ offset: true }).nullable(),
  sentAt: z.iso.datetime({ offset: true }),
  meeting: z.strictObject({
    id: z.uuid(),
    title: z.string().min(1),
    startsAt: z.iso.datetime({ offset: true }),
    timeZone: z.string().min(1),
    status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]),
  }),
});

export const meetingNotificationsResponseSchema = z.strictObject({
  data: z.array(meetingNotificationSchema),
  unreadCount: z.number().int().nonnegative(),
});

export type MeetingNotification = z.infer<typeof meetingNotificationSchema>;
