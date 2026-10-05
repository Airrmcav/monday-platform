import { z } from 'zod';

export const createWorkspaceSchema = z.strictObject({
  name: z
    .string({ error: 'El nombre del espacio es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'El nombre no puede superar los 120 caracteres.'),

  description: z
    .string()
    .trim()
    .max(1000, 'La descripción no puede superar los 1000 caracteres.')
    .transform((value) => value || null)
    .optional(),

  areaId: z.uuid({
    error: 'Selecciona un área válida.',
  }),
  memberIds: z
    .array(
      z.uuid({
        error: 'Cada miembro debe tener un identificador válido.',
      }),
    )
    .max(100, 'Puedes asignar hasta 100 miembros por solicitud.')
    .refine((ids) => new Set(ids).size === ids.length, {
      message: 'No puedes agregar al mismo usuario más de una vez.',
    })
    .default([]),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
