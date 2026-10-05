import z from 'zod';

export const listTaskCommentsSchema = z.strictObject({
  page: z.coerce
    .number()
    .int('La página debe ser un número entero.')
    .min(1, 'La página debe ser mayor que cero.')
    .max(1_000_000, 'La página es demasiado grande.')
    .default(1),

  pageSize: z.coerce
    .number()
    .int('El tamaño de la página debe ser un número entero.')
    .min(1, 'El tamaño de la página debe ser mayor que cero.')
    .max(50, 'Puedes consultar hasta 50 comentarios por página.')
    .default(20),
});

export type ListTaskCommentsInput = z.infer<typeof listTaskCommentsSchema>;
