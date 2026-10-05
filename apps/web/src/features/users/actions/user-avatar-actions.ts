"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const userIdSchema = z.string().uuid();
const uploadInputSchema = z.strictObject({
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  sizeBytes: z.number().int().positive().max(2 * 1024 * 1024),
});
const uploadIntentSchema = z.strictObject({
  bucket: z.string().min(1),
  path: z.string().min(1),
  token: z.string().min(1),
  signedUrl: z.string().min(1),
});
const avatarResultSchema = z.strictObject({
  avatarUrl: z.string().url().nullable(),
});

export type UserAvatarActionResult<T> =
  | { success: true; result: T }
  | { success: false; error: string; unauthenticated?: true };

export type UserAvatarUploadIntent = z.infer<typeof uploadIntentSchema>;

export async function createUserAvatarUploadIntentAction(
  userId: string,
  input: { contentType: string; sizeBytes: number },
): Promise<UserAvatarActionResult<UserAvatarUploadIntent>> {
  const parsedUserId = userIdSchema.safeParse(userId);
  const parsedInput = uploadInputSchema.safeParse(input);

  if (!parsedUserId.success || !parsedInput.success) {
    return { success: false, error: "La imagen seleccionada no es válida." };
  }

  return requestAvatarAction(
    `/users/${encodeURIComponent(parsedUserId.data)}/avatar/upload-intent`,
    "POST",
    parsedInput.data,
    uploadIntentSchema,
  );
}

export async function confirmUserAvatarUploadAction(
  userId: string,
  path: string,
): Promise<UserAvatarActionResult<z.infer<typeof avatarResultSchema>>> {
  const parsedUserId = userIdSchema.safeParse(userId);

  if (!parsedUserId.success || !path) {
    return { success: false, error: "No pudimos confirmar la imagen." };
  }

  return requestAvatarAction(
    `/users/${encodeURIComponent(parsedUserId.data)}/avatar`,
    "POST",
    { path },
    avatarResultSchema,
  );
}

export async function removeUserAvatarAction(
  userId: string,
): Promise<UserAvatarActionResult<z.infer<typeof avatarResultSchema>>> {
  const parsedUserId = userIdSchema.safeParse(userId);

  if (!parsedUserId.success) {
    return { success: false, error: "El usuario no es válido." };
  }

  return requestAvatarAction(
    `/users/${encodeURIComponent(parsedUserId.data)}/avatar`,
    "DELETE",
    undefined,
    avatarResultSchema,
  );
}

async function requestAvatarAction<T>(
  path: string,
  method: "POST" | "DELETE",
  body: unknown,
  responseSchema: z.ZodType<T>,
): Promise<UserAvatarActionResult<T>> {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return {
      success: false,
      error: "Tu sesión expiró. Inicia sesión nuevamente.",
      unauthenticated: true,
    };
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl.replace(/\/+$/, "")}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${session.access_token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return {
      success: false,
      error: "No pudimos conectar con el servicio de imágenes.",
    };
  }

  if (response.status === 401) {
    return {
      success: false,
      error: "Tu sesión expiró. Inicia sesión nuevamente.",
      unauthenticated: true,
    };
  }

  if (response.status === 403) {
    return {
      success: false,
      error: "Solo los administradores pueden modificar esta imagen.",
    };
  }

  if (!response.ok) {
    return {
      success: false,
      error:
        response.status === 400
          ? "La imagen no es válida. Revisa el formato y vuelve a intentarlo."
          : "No pudimos guardar la imagen. Intenta nuevamente.",
    };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return {
      success: false,
      error: "El servicio devolvió una respuesta no válida.",
    };
  }

  const parsedPayload = responseSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return {
      success: false,
      error: "El servicio devolvió una respuesta no válida.",
    };
  }

  return { success: true, result: parsedPayload.data };
}
