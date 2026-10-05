import { z } from 'zod';

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

export const createAvatarUploadIntentSchema = z.strictObject({
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  sizeBytes: z.number().int().positive().max(AVATAR_MAX_BYTES),
});

export const confirmAvatarUploadSchema = z.strictObject({
  path: z.string().min(1).max(200),
});

export type CreateAvatarUploadIntentInput = z.infer<
  typeof createAvatarUploadIntentSchema
>;
export type ConfirmAvatarUploadInput = z.infer<
  typeof confirmAvatarUploadSchema
>;
