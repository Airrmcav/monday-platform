import { z } from 'zod';

export const updateWorkspaceSchema = z
  .strictObject({
    name: z
      .string({
        error: 'El nombre del espacio debe ser un texto.',
      })
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(120, 'El nombre no puede superar los 120 caracteres.')
      .optional(),

    description: z
      .string()
      .trim()
      .max(1000, 'La descripción no puede superar los 1000 caracteres.')
      .transform((value) => value || null)
      .nullable()
      .optional(),

    memberIds: z
      .array(
        z.uuid({
          error: 'Cada miembro debe tener un identificador válido.',
        }),
      )
      .max(100, 'El espacio puede tener hasta 100 miembros.')
      .refine((ids) => new Set(ids).size === ids.length, {
        message: 'No puedes agregar al mismo usuario más de una vez.',
      })
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Envía al menos un campo para actualizar.',
  });

export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
