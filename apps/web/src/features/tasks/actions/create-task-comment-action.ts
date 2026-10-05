"use server";

import { redirect } from "next/navigation";
import { createTaskCommentSchema } from "../schemas/task-comments.schema";
import { createTaskComment } from "../tasks.service";
import { revalidatePath } from "next/cache";
import { taskSchema } from "../schemas/tasks.schema";

export type CreateTaskCommentState = {
  error: string;
  success?: string;
  fieldErrors?: {
    content?: string[];
    attachmentIds?: string[];
  };
};

export async function createTaskCommentAction(
  taskId: string,
  _previousState: CreateTaskCommentState,
  formData: FormData,
): Promise<CreateTaskCommentState> {
  const taskIdValidation = taskSchema.shape.id.safeParse(taskId);

  if (!taskIdValidation.success) {
    return {
      error: "El identificador de la tarea no es válido.",
    };
  }
  const validation = createTaskCommentSchema.safeParse({
    content: formData.get("content"),
    attachmentIds: formData.getAll("attachmentIds"),
  });

  if (!validation.success) {
    const fieldErrors: NonNullable<CreateTaskCommentState["fieldErrors"]> = {};

    for (const issue of validation.error.issues) {
      const field = issue.path[0];

      if (field === "content" || field === "attachmentIds") {
        const messages = fieldErrors[field] ?? [];
        messages.push(issue.message);
        fieldErrors[field] = messages;
      }
    }

    return {
      error: "Revisa el comentario antes de publicarlo.",
      fieldErrors,
    };
  }

  const result = await createTaskComment(
    taskIdValidation.data,
    validation.data,
  );

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error: "No tienes permiso para comentar en esta tarea.",
      };

    case "not-found":
      return {
        error: "La tarea no existe o ya no tienes acceso a ella.",
      };

    case "invalid":
      return {
        error: "Revisa el contenido del comentario.",
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar la publicación. Recarga la tarea antes de volver a intentarlo.",
      };

    case "success":
      revalidatePath(`/tasks/${result.comment.taskId}`);

      return {
        error: "",
        success: "Comentario publicado correctamente.",
      };
  }
}
