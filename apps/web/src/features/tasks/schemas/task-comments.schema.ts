import { z } from "zod";

const attachmentIdsSchema = z
  .array(
    z.uuid({
      error: "El identificador del adjunto no es válido.",
    }),
  )
  .max(10, "Puedes adjuntar hasta 10 archivos por comentario.")
  .refine((ids) => new Set(ids).size === ids.length, {
    message: "No puedes adjuntar el mismo archivo más de una vez.",
  });

export const taskAttachmentSchema = z.object({
  id: z.uuid(),
  taskId: z.uuid(),
  commentId: z.uuid(),
  uploadedById: z.uuid(),
  uploadedByName: z.string(),
  originalName: z.string(),
  contentType: z.string(),
  sizeBytes: z.number().int().positive(),
  createdAt: z.iso.datetime({ offset: true }),
});

export type TaskAttachment = z.infer<typeof taskAttachmentSchema>;

export const taskCommentSchema = z.object({
  id: z.uuid(),
  taskId: z.uuid(),
  authorId: z.uuid(),
  authorName: z.string(),
  content: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  attachments: z.array(taskAttachmentSchema),
});

export const taskCommentsPaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(50),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export const taskCommentsResponseSchema = z.object({
  data: z.array(taskCommentSchema),
  pagination: taskCommentsPaginationSchema,
});

export const createTaskCommentSchema = z.strictObject({
  content: z
    .string({
      error: "El comentario debe ser un texto.",
    })
    .trim()
    .min(1, "Escribe un comentario antes de publicarlo.")
    .max(5000, "El comentario no puede superar los 5,000 caracteres."),

  attachmentIds: attachmentIdsSchema.default([]),
});

export type TaskComment = z.infer<typeof taskCommentSchema>;

export type TaskCommentsResponse = z.infer<typeof taskCommentsResponseSchema>;

export type CreateTaskCommentInput = z.infer<typeof createTaskCommentSchema>;

export const taskAttachmentUploadFileSchema = z.object({
  originalName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
});

export const createTaskAttachmentUploadIntentsSchema = z.object({
  files: z.array(taskAttachmentUploadFileSchema).min(1).max(10),
});

export const taskAttachmentUploadIntentSchema = z.object({
  attachmentId: z.uuid(),
  bucket: z.string().min(1),
  storagePath: z.string().min(1),
  uploadToken: z.string().min(1),
  originalName: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  expiresAt: z.iso.datetime({ offset: true }),
});

export const taskAttachmentUploadIntentsResponseSchema = z.object({
  attachments: z.array(taskAttachmentUploadIntentSchema),
});

export type TaskAttachmentUploadFile = z.infer<
  typeof taskAttachmentUploadFileSchema
>;

export type CreateTaskAttachmentUploadIntentsInput = z.infer<
  typeof createTaskAttachmentUploadIntentsSchema
>;

export type TaskAttachmentUploadIntent = z.infer<
  typeof taskAttachmentUploadIntentSchema
>;

export type TaskAttachmentUploadIntentsResponse = z.infer<
  typeof taskAttachmentUploadIntentsResponseSchema
>;
