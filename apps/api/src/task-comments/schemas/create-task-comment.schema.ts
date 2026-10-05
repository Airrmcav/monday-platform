import z from 'zod';

const attachmentIdsSchema = z
  .array(
    z.uuid({
      error: 'El identificador del adjunto no es válido.',
    }),
  )
  .max(10, 'Puedes adjuntar hasta 10 archivos por comentario.')
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'No puedes adjuntar el mismo archivo más de una vez.',
  });

export const createTaskCommentSchema = z.strictObject({
  content: z
    .string({ error: 'El comentario debe ser un texto.' })
    .trim()
    .min(1, 'Escribe un comentario antes de publicarlo.')
    .max(5_000, 'El comentario no puede superar los 5,000 caracteres.'),

  attachmentIds: attachmentIdsSchema.default([]),
});

export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>;
