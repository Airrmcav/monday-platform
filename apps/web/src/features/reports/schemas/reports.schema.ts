import { z } from "zod";

const reportPersonSchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1),
});

export const reportsDataSchema = z.strictObject({
  generatedAt: z.iso.datetime({ offset: true }),
  areas: z.array(
    z.strictObject({
      id: z.uuid(),
      name: z.string().min(1),
      createdAt: z.iso.datetime({ offset: true }),
      updatedAt: z.iso.datetime({ offset: true }),
    }),
  ),
  workspaces: z.array(
    z.strictObject({
      id: z.uuid(),
      name: z.string().min(1),
      description: z.string().nullable(),
      areaId: z.uuid(),
      createdById: z.uuid(),
      createdAt: z.iso.datetime({ offset: true }),
      updatedAt: z.iso.datetime({ offset: true }),
      area: z.strictObject({
        id: z.uuid(),
        name: z.string().min(1),
      }),
      createdBy: reportPersonSchema,
      members: z.array(reportPersonSchema),
    }),
  ),
  tasks: z.array(
    z.strictObject({
      id: z.uuid(),
      workspaceId: z.uuid(),
      parentId: z.uuid().nullable(),
      createdById: z.uuid(),
      title: z.string().min(1),
      description: z.string().nullable(),
      status: z.enum(["PENDING", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"]),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
      startsAt: z.iso.datetime({ offset: true }).nullable(),
      dueAt: z.iso.datetime({ offset: true }),
      completedAt: z.iso.datetime({ offset: true }).nullable(),
      isBlocked: z.boolean(),
      blockedReason: z.string().nullable(),
      createdAt: z.iso.datetime({ offset: true }),
      updatedAt: z.iso.datetime({ offset: true }),
      createdBy: reportPersonSchema,
      parent: z
        .strictObject({
          id: z.uuid(),
          title: z.string().min(1),
        })
        .nullable(),
      workspace: z.strictObject({
        id: z.uuid(),
        name: z.string().min(1),
        area: z.strictObject({
          id: z.uuid(),
          name: z.string().min(1),
        }),
      }),
      participants: z.array(
        reportPersonSchema.extend({
          role: z.enum(["RESPONSIBLE", "COLLABORATOR"]),
        }),
      ),
      comments: z.array(
        z.strictObject({
          id: z.uuid(),
          authorName: z.string().min(1),
          content: z.string(),
          createdAt: z.iso.datetime({ offset: true }),
        }),
      ),
      history: z.array(
        z.strictObject({
          id: z.uuid(),
          action: z.enum([
            "CREATED",
            "UPDATED",
            "STATUS_CHANGED",
            "BLOCKED",
            "UNBLOCKED",
            "BLOCK_REASON_CHANGED",
          ]),
          actorName: z.string().min(1),
          changes: z.unknown(),
          schemaVersion: z.number().int().positive(),
          createdAt: z.iso.datetime({ offset: true }),
        }),
      ),
      attachments: z.array(
        z.strictObject({
          id: z.uuid(),
          originalName: z.string().min(1),
          contentType: z.string().min(1),
          sizeBytes: z.number().int().nonnegative(),
          uploadedByName: z.string().min(1),
          createdAt: z.iso.datetime({ offset: true }),
        }),
      ),
    }),
  ),
});

export type ReportsData = z.infer<typeof reportsDataSchema>;
