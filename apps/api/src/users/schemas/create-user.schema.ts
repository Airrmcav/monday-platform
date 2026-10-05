import { z } from 'zod';

export const createUserSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(120, 'El nombre no puede superar los 120 caracteres.'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, 'El correo es demasiado largo.')
    .pipe(z.email({ error: 'Ingresa un correo electrónico válido.' })),

  password: z
    .string()
    .min(12, 'La contraseña debe tener al menos 12 caracteres.')
    .max(128, 'La contraseña no puede superar los 128 caracteres.'),

  isAdmin: z.boolean().default(false),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
