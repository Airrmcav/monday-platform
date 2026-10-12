import { z } from "zod";

export const userTaskSummarySchema = z.object({
  openTaskCount: z.number().int().nonnegative(),
  overdueTaskCount: z.number().int().nonnegative(),
  tasksByStatus: z
    .object({
      PENDING: z.number().int().nonnegative(),
      IN_PROGRESS: z.number().int().nonnegative(),
      IN_REVIEW: z.number().int().nonnegative(),
      COMPLETED: z.number().int().nonnegative(),
    })
    .optional(),
});

export type UserTaskSummary = z.infer<typeof userTaskSummarySchema>;

export const userListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  name: z.string(),
  avatarUrl: z.string().url().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  isAdmin: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
  taskSummary: userTaskSummarySchema.optional(),
});

export const userProfileSchema = z.strictObject({
  id: z.string().uuid(),
  name: z.string(),
  email: z.email(),
  avatarUrl: z.string().url().nullable(),
  taskSummary: userTaskSummarySchema.extend({
    tasksByStatus: z.object({
      PENDING: z.number().int().nonnegative(),
      IN_PROGRESS: z.number().int().nonnegative(),
      IN_REVIEW: z.number().int().nonnegative(),
      COMPLETED: z.number().int().nonnegative(),
    }),
  }),
  profileSummary: z.strictObject({
    totalTasks: z.number().int().nonnegative(),
    activeTasks: z.number().int().nonnegative(),
    completedTasks: z.number().int().nonnegative(),
    overdueTasks: z.number().int().nonnegative(),
    workspaceCount: z.number().int().nonnegative(),
    completionRate: z.number().int().min(0).max(100),
  }),
  workspaces: z.array(
    z.strictObject({
      id: z.string().uuid(),
      name: z.string(),
      areaName: z.string(),
      taskCount: z.number().int().nonnegative(),
    }),
  ),
  recentTasks: z.array(
    z.strictObject({
      id: z.string().uuid(),
      title: z.string(),
      status: z.enum(["PENDING", "IN_PROGRESS", "IN_REVIEW", "COMPLETED"]),
      priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
      dueAt: z.iso.datetime({ offset: true }),
      isOverdue: z.boolean(),
      workspace: z.strictObject({
        id: z.string().uuid(),
        name: z.string(),
      }),
    }),
  ),
  recentActivity: z.array(
    z.strictObject({
      id: z.string().uuid(),
      action: z.enum([
        "CREATED",
        "UPDATED",
        "STATUS_CHANGED",
        "BLOCKED",
        "UNBLOCKED",
        "BLOCK_REASON_CHANGED",
      ]),
      createdAt: z.iso.datetime({ offset: true }),
      task: z.strictObject({
        id: z.string().uuid(),
        title: z.string(),
        workspace: z.strictObject({
          name: z.string(),
        }),
      }),
    }),
  ),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const usersPaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const usersResponseSchema = z.object({
  data: z.array(userListItemSchema),
  pagination: usersPaginationSchema,
});

export type UserListItem = z.infer<typeof userListItemSchema>;
export type UsersResponse = z.infer<typeof usersResponseSchema>;

export const createUserSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(120, "El nombre no puede superar los 120 caracteres."),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "El correo es demasiado largo.")
    .pipe(z.email({ error: "Ingresa un correo electrónico válido." })),

  password: z
    .string()
    .min(12, "La contraseña debe tener al menos 12 caracteres.")
    .max(128, "La contraseña no puede superar los 128 caracteres."),

  isAdmin: z.boolean().default(false),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema
  .pick({
    name: true,
    isAdmin: true,
  })
  .extend({
    isAdmin: z.boolean(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .partial()
  .refine(
    (data) =>
      data.name !== undefined ||
      data.isAdmin !== undefined ||
      data.status !== undefined,
    {
      message: "Debes enviar al menos un campo para actualizar.",
    },
  );

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
