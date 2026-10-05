import { z } from "zod";

export const workspaceSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  areaId: z.uuid(),
  createdById: z.uuid(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  archivedAt: z.iso.datetime({ offset: true }).nullable(),
  area: z.object({
    id: z.uuid(),
    name: z.string(),
  }),
});

export const workspaceEditMemberSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const workspaceForEditSchema = workspaceSchema.extend({
  members: z.array(workspaceEditMemberSchema),
});

export const updateWorkspaceSchema = z
  .strictObject({
    name: z
      .string({
        error: "El nombre del espacio debe ser un texto.",
      })
      .trim()
      .min(2, "El nombre debe tener al menos 2 caracteres.")
      .max(120, "El nombre no puede superar los 120 caracteres.")
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, "La descripción no puede superar los 1000 caracteres.")
      .transform((value) => value || null)
      .nullable()
      .optional(),

    memberIds: z
      .array(
        z.uuid({
          error: "Cada miembro debe tener un identificador válido.",
        }),
      )
      .max(100, "El espacio puede tener hasta 100 miembros.")
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "No puedes agregar al mismo usuario más de una vez.",
      })
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Envía al menos un campo para actualizar.",
  });

export const updateWorkspaceResponseSchema = z.object({
  id: z.uuid(),
  areaId: z.uuid(),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type WorkspaceEditMember = z.infer<typeof workspaceEditMemberSchema>;

export type WorkspaceForEdit = z.infer<typeof workspaceForEditSchema>;

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export type UpdateWorkspaceResponse = z.infer<
  typeof updateWorkspaceResponseSchema
>;

export const workspaceListItemSchema = workspaceSchema.extend({
  members: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
    }),
  ),
  taskCount: z.number().int().nonnegative(),
  completedTaskCount: z.number().int().nonnegative(),
  overdueTaskCount: z.number().int().nonnegative(),
  blockedTaskCount: z.number().int().nonnegative(),
});

export const workspacesResponseSchema = z.object({
  data: z.array(workspaceListItemSchema),
});

export type WorkspaceListItem = z.infer<typeof workspaceListItemSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspacesResponse = z.infer<typeof workspacesResponseSchema>;

export const createWorkspaceSchema = z.strictObject({
  name: z
    .string({ error: "El nombre del espacio es obligatorio." })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(120, "El nombre no puede superar los 120 caracteres."),

  description: z
    .string()
    .trim()
    .max(1000, "La descripción no puede superar los 1000 caracteres.")
    .optional(),

  areaId: z.uuid({
    error: "Selecciona un área válida.",
  }),

  memberIds: z
    .array(
      z.uuid({
        error: "Cada miembro debe tener un identificador válido.",
      }),
    )
    .max(100, "Puedes asignar hasta 100 miembros por solicitud.")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "No puedes agregar al mismo usuario más de una vez.",
    })
    .default([]),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const workspaceMemberSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
});

export const workspaceMembersResponseSchema = z.object({
  data: z.array(workspaceMemberSchema),
});

export type WorkspaceMember = z.infer<typeof workspaceMemberSchema>;

export type WorkspaceMembersResponse = z.infer<
  typeof workspaceMembersResponseSchema
>;
