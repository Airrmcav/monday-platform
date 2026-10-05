import { z } from "zod";

import {
  taskParticipantRoleSchema,
  taskPrioritySchema,
  taskStatusSchema,
} from "./tasks.schema";

export const taskHistoryActionSchema = z.enum([
  "CREATED",
  "UPDATED",
  "STATUS_CHANGED",
  "BLOCKED",
  "UNBLOCKED",
  "BLOCK_REASON_CHANGED",
]);

const historyDateSchema = z.iso.datetime({
  offset: true,
});

const historyParticipantSchema = z.object({
  userId: z.uuid(),
  name: z.string(),
  role: taskParticipantRoleSchema,
});

export const taskHistoryChangesSchema = z.object({
  title: z
    .object({
      before: z.string().nullable(),
      after: z.string(),
    })
    .optional(),

  description: z
    .object({
      before: z.string().nullable(),
      after: z.string().nullable(),
    })
    .optional(),

  priority: z
    .object({
      before: taskPrioritySchema.nullable(),
      after: taskPrioritySchema,
    })
    .optional(),

  status: z
    .object({
      before: taskStatusSchema.nullable(),
      after: taskStatusSchema,
    })
    .optional(),

  startsAt: z
    .object({
      before: historyDateSchema.nullable(),
      after: historyDateSchema.nullable(),
    })
    .optional(),

  dueAt: z
    .object({
      before: historyDateSchema.nullable(),
      after: historyDateSchema,
    })
    .optional(),

  completedAt: z
    .object({
      before: historyDateSchema.nullable(),
      after: historyDateSchema.nullable(),
    })
    .optional(),

  isBlocked: z
    .object({
      before: z.boolean(),
      after: z.boolean(),
    })
    .optional(),

  blockedReason: z
    .object({
      before: z.string().nullable(),
      after: z.string().nullable(),
    })
    .optional(),

  participants: z
    .object({
      before: z.array(historyParticipantSchema),
      after: z.array(historyParticipantSchema),
    })
    .optional(),
});

export const taskHistoryEntrySchema = z.object({
  id: z.uuid(),
  taskId: z.uuid(),
  actorId: z.uuid(),
  actorName: z.string(),
  action: taskHistoryActionSchema,
  changes: taskHistoryChangesSchema,
  schemaVersion: z.literal(1),
  createdAt: historyDateSchema,
});

export const taskHistoryPaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(50),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const taskHistoryResponseSchema = z.object({
  data: z.array(taskHistoryEntrySchema),
  pagination: taskHistoryPaginationSchema,
});

export type TaskHistoryAction = z.infer<typeof taskHistoryActionSchema>;

export type TaskHistoryChanges = z.infer<typeof taskHistoryChangesSchema>;

export type TaskHistoryEntry = z.infer<typeof taskHistoryEntrySchema>;

export type TaskHistoryResponse = z.infer<typeof taskHistoryResponseSchema>;
