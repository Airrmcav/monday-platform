import { z } from "zod";

export const taskStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "IN_REVIEW",
  "COMPLETED",
]);

export const taskParticipantRoleSchema = z.enum([
  "RESPONSIBLE",
  "COLLABORATOR",
]);

export const taskParticipantSchema = z.object({
  userId: z.uuid(),
  role: taskParticipantRoleSchema,
  user: z.object({
    id: z.uuid(),
    name: z.string(),
    avatarUrl: z.string().url().nullable().optional(),
  }),
});

export const taskPrioritySchema = z.enum(["LOW", "NORMAL", "HIGH", "URGENT"], {
  error: "Selecciona una prioridad válida.",
});

export type TaskPriority = z.infer<typeof taskPrioritySchema>;

export const taskSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  parentId: z.uuid().nullable(),
  createdById: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  startsAt: z.iso.datetime({ offset: true }).nullable(),
  dueAt: z.iso.datetime({ offset: true }),
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  isBlocked: z.boolean(),
  blockedReason: z.string().nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  archivedAt: z.iso.datetime({ offset: true }).nullable(),
  participants: z.array(taskParticipantSchema),
});

const participantIdsSchema = z
  .array(
    z.uuid({
      error: "El identificador del usuario no es válido.",
    }),
  )
  .max(100, "Puedes seleccionar hasta 100 usuarios por grupo.")
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "No puedes seleccionar al mismo usuario más de una vez.",
  });

export const createTaskSchema = z
  .strictObject({
    workspaceId: z.uuid({
      error: "Selecciona un espacio válido.",
    }),

    parentId: z
      .uuid({
        error: "Selecciona una tarea principal válida.",
      })
      .optional(),

    title: z
      .string({ error: "El título es obligatorio." })
      .trim()
      .min(3, "El título debe tener al menos 3 caracteres.")
      .max(200, "El título no puede superar los 200 caracteres."),

    description: z
      .string()
      .trim()
      .max(5000, "La descripción no puede superar los 5000 caracteres.")
      .optional(),

    priority: taskPrioritySchema.default("NORMAL"),

    dueAt: z.iso.datetime({
      offset: true,
      error: "La fecha de entrega debe incluir hora y zona horaria.",
    }),

    responsibleIds: participantIdsSchema.refine((ids) => ids.length > 0, {
      message: "Selecciona al menos un responsable.",
    }),

    collaboratorIds: participantIdsSchema.default([]),
  })
  .superRefine((data, context) => {
    const responsibleIds = new Set(data.responsibleIds);

    if (data.collaboratorIds.some((id) => responsibleIds.has(id))) {
      context.addIssue({
        code: "custom",
        path: ["collaboratorIds"],
        message:
          "Un usuario no puede ser responsable y colaborador de la misma tarea.",
      });
    }
  });

export type Task = z.infer<typeof taskSchema>;
export type TaskStatus = z.infer<typeof taskStatusSchema>;
export type TaskParticipant = z.infer<typeof taskParticipantSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const tasksResponseSchema = z.object({
  data: z.array(taskSchema),
});

export type TasksResponse = z.infer<typeof tasksResponseSchema>;

export const taskDetailSchema = taskSchema.extend({
  workspace: z.object({
    id: z.uuid(),
    name: z.string(),
    area: z.object({
      id: z.uuid(),
      name: z.string(),
    }),
  }),

  parent: z
    .object({
      id: z.uuid(),
      title: z.string(),
    })
    .nullable(),
});

export type TaskDetail = z.infer<typeof taskDetailSchema>;

export const updateTaskStatusSchema = z.strictObject({
  status: taskStatusSchema,
});

export const updateTaskStatusResponseSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  parentId: z.uuid().nullable(),
  status: taskStatusSchema,
  completedAt: z.iso.datetime({ offset: true }).nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;

export type UpdateTaskStatusResponse = z.infer<
  typeof updateTaskStatusResponseSchema
>;

export const updateTaskBlockSchema = z.discriminatedUnion("isBlocked", [
  z.strictObject({
    isBlocked: z.literal(true),
    blockedReason: z
      .string({
        error: "Debes indicar el motivo del bloqueo.",
      })
      .trim()
      .min(3, "El motivo debe tener al menos 3 caracteres.")
      .max(1000, "El motivo no puede superar los 1000 caracteres."),
  }),

  z.strictObject({
    isBlocked: z.literal(false),
  }),
]);

export const updateTaskBlockResponseSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  parentId: z.uuid().nullable(),
  status: taskStatusSchema,
  isBlocked: z.boolean(),
  blockedReason: z.string().nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type UpdateTaskBlockInput = z.infer<typeof updateTaskBlockSchema>;

export type UpdateTaskBlockResponse = z.infer<
  typeof updateTaskBlockResponseSchema
>;

export const updateTaskSchema = z
  .strictObject({
    title: z
      .string({ error: "El título debe ser un texto." })
      .trim()
      .min(3, "El título debe tener al menos 3 caracteres.")
      .max(200, "El título no puede superar los 200 caracteres.")
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000, "La descripción no puede superar los 5000 caracteres.")
      .transform((value) => value || null)
      .nullable()
      .optional(),

    priority: taskPrioritySchema.optional(),

    dueAt: z.iso
      .datetime({
        offset: true,
        error: "La fecha de entrega debe incluir hora y zona horaria.",
      })
      .optional(),

    responsibleIds: participantIdsSchema
      .min(1, "Selecciona al menos un responsable.")
      .optional(),

    collaboratorIds: participantIdsSchema.optional(),
  })
  .superRefine((data, context) => {
    const hasChanges = Object.values(data).some((value) => value !== undefined);

    if (!hasChanges) {
      context.addIssue({
        code: "custom",
        message: "Envía al menos un campo para actualizar.",
      });
    }

    if (
      data.responsibleIds !== undefined &&
      data.collaboratorIds !== undefined
    ) {
      const responsibleIds = new Set(data.responsibleIds);

      if (data.collaboratorIds.some((id) => responsibleIds.has(id))) {
        context.addIssue({
          code: "custom",
          path: ["collaboratorIds"],
          message:
            "Un usuario no puede ser responsable y colaborador de la misma tarea.",
        });
      }
    }
  });

export const updateTaskResponseSchema = z.object({
  id: z.uuid(),
  workspaceId: z.uuid(),
  parentId: z.uuid().nullable(),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export type UpdateTaskResponse = z.infer<typeof updateTaskResponseSchema>;
