import { z } from 'zod';

export const updateUserSchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres.')
      .max(120, 'El nombre no puede superar los 120 caracteres.')
      .optional(),

    isAdmin: z.boolean().optional(),

    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.isAdmin !== undefined ||
      data.status !== undefined,
    {
      message: 'Debes enviar al menos un campo para actualizar.',
    },
  );

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
