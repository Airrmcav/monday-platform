import { z } from "zod";

export const userListItemSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  name: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  isAdmin: z.boolean(),
  createdAt: z.iso.datetime({ offset: true }),
});

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
