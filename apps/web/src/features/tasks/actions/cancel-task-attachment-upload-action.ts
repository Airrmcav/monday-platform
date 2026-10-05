"use server";

import { redirect } from "next/navigation";

import { cancelTaskAttachmentUpload } from "../tasks.service";

export type CancelTaskAttachmentUploadActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
    };

export async function cancelTaskAttachmentUploadAction(
  taskId: string,
  attachmentId: string,
): Promise<CancelTaskAttachmentUploadActionResult> {
  const result = await cancelTaskAttachmentUpload(taskId, attachmentId);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        success: false,
        error: "No tienes permiso para retirar este archivo.",
      };

    case "not-found":
      return {
        success: false,
        error: "El archivo ya no está disponible para retirarse.",
      };

    case "unavailable":
      return {
        success: false,
        error: "No pudimos retirar el archivo. Intenta nuevamente.",
      };

    case "success":
      return {
        success: true,
      };
  }
}
