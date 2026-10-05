"use client";

import {
  confirmUserAvatarUploadAction,
  createUserAvatarUploadIntentAction,
} from "../actions/user-avatar-actions";
import { createClient } from "@/lib/supabase/client";

export const USER_AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const USER_AVATAR_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function validateUserAvatar(file: File): string | null {
  if (!USER_AVATAR_CONTENT_TYPES.some((contentType) => contentType === file.type)) {
    return "La imagen debe estar en formato JPG, PNG o WebP.";
  }

  if (file.size === 0 || file.size > USER_AVATAR_MAX_BYTES) {
    return "La imagen debe pesar más de 0 bytes y no superar 2 MB.";
  }

  return null;
}

export async function uploadUserAvatar(
  userId: string,
  file: File,
): Promise<
  | { success: true; avatarUrl: string | null }
  | { success: false; error: string; unauthenticated?: true }
> {
  const validationError = validateUserAvatar(file);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const intentResult = await createUserAvatarUploadIntentAction(userId, {
    contentType: file.type,
    sizeBytes: file.size,
  });

  if (!intentResult.success) {
    return intentResult;
  }

  const { bucket, path, token } = intentResult.result;
  const { error } = await createClient()
    .storage.from(bucket)
    .uploadToSignedUrl(path, token, file, { contentType: file.type });

  if (error) {
    return {
      success: false,
      error: "No pudimos subir la imagen. Intenta nuevamente.",
    };
  }

  const confirmResult = await confirmUserAvatarUploadAction(userId, path);

  if (!confirmResult.success) {
    return confirmResult;
  }

  return {
    success: true,
    avatarUrl: confirmResult.result.avatarUrl,
  };
}
