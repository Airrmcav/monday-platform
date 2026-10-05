import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({ error: "Ingresa tu correo." })
    .email("Ingresa un correo válido")
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Ingresa un correo válido." })),

  password: z
    .string({ error: "Ingresa tu contraseña." })
    .min(1, { error: "Ingresa tu contraseña." }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
