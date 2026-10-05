import { z } from "zod";

export const taskNotificationTypeSchema = z.enum([
  "TASK_ASSIGNED",
  "TASK_STATUS_CHANGED",
  "TASK_BLOCKED",
  "TASK_UNBLOCKED",
  "TASK_UPDATED",
  "TASK_COMMENTED",
  "TASK_DUE_SOON",
  "TASK_OVERDUE",
]);

export const taskNotificationSchema = z.strictObject({
  id: z.uuid(),
  type: taskNotificationTypeSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  actorName: z.string().nullable(),
  readAt: z.iso
    .datetime({
      offset: true,
    })
    .nullable(),
  createdAt: z.iso.datetime({
    offset: true,
  }),
  task: z.strictObject({
    id: z.uuid(),
    title: z.string().min(1),
    workspace: z.strictObject({
      id: z.uuid(),
      name: z.string().min(1),
    }),
  }),
});

export const taskNotificationsResponseSchema = z.strictObject({
  data: z.array(taskNotificationSchema),
  pagination: z.strictObject({
    page: z.number().int().positive(),
    pageSize: z.number().int().min(1).max(50),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
  unreadCount: z.number().int().nonnegative(),
});

export type TaskNotification = z.infer<typeof taskNotificationSchema>;

export type TaskNotificationsResponse = z.infer<
  typeof taskNotificationsResponseSchema
>;
