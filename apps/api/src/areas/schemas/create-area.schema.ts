import { z } from 'zod';

export const createAreaSchema = z.strictObject({
  name: z
    .string({ error: 'El nombre del área es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(100, 'El nombre no puede superar los 100 caracteres.'),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
