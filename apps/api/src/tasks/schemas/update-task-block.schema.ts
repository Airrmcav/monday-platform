import { z } from 'zod';

export const updateTaskBlockSchema = z.discriminatedUnion('isBlocked', [
  z.strictObject({
    isBlocked: z.literal(true),
    blockedReason: z
      .string({
        error: 'Debes indicar el motivo del bloqueo.',
      })
      .trim()
      .min(3, 'El motivo debe tener al menos 3 caracteres.')
      .max(1000, 'El motivo no puede superar los 1000 caracteres.'),
  }),

  z.strictObject({
    isBlocked: z.literal(false),
  }),
]);

export type UpdateTaskBlockInput = z.infer<typeof updateTaskBlockSchema>;
