"use server";

import { redirect } from "next/navigation";

import type {
  CreateTaskAttachmentUploadIntentsInput,
  TaskAttachmentUploadIntent,
} from "../schemas/task-comments.schema";
import { createTaskAttachmentUploadIntents } from "../tasks.service";

export type CreateTaskAttachmentUploadIntentsActionResult =
  | {
      success: true;
      attachments: TaskAttachmentUploadIntent[];
    }
  | {
      success: false;
      error: string;
    };

export async function createTaskAttachmentUploadIntentsAction(
  taskId: string,
  input: CreateTaskAttachmentUploadIntentsInput,
): Promise<CreateTaskAttachmentUploadIntentsActionResult> {
  const result = await createTaskAttachmentUploadIntents(taskId, input);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        success: false,
        error: "No tienes permiso para adjuntar archivos a esta tarea.",
      };

    case "not-found":
      return {
        success: false,
        error: "La tarea no existe o ya no tienes acceso a ella.",
      };

    case "invalid":
      return {
        success: false,
        error:
          "Revisa los archivos seleccionados. Deben cumplir el tipo, tamaño y cantidad permitidos.",
      };

    case "unavailable":
      return {
        success: false,
        error: "No pudimos preparar la carga de archivos. Intenta nuevamente.",
      };

    case "success":
      return {
        success: true,
        attachments: result.result.attachments,
      };
  }
}
