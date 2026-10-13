"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { taskSchema } from "../schemas/tasks.schema";
import { deleteTask } from "../tasks.service";

export type DeleteTaskState = {
  error: string;
};

export async function deleteTaskAction(
  taskId: string,
  _previousState: DeleteTaskState,
): Promise<DeleteTaskState> {
  const taskIdValidation = taskSchema.shape.id.safeParse(taskId);

  if (!taskIdValidation.success) {
    return { error: "El identificador de la tarea no es válido." };
  }

  const result = await deleteTask(taskIdValidation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error: "Solo un administrador con acceso activo puede eliminar tareas.",
      };

    case "not-found":
      return {
        error: "La tarea no existe o ya no tienes acceso a ella.",
      };

    case "invalid":
      return {
        error:
          "No se pudo eliminar la tarea porque su estructura de subtareas es inconsistente.",
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar la eliminación. Revisa la tarea antes de volver a intentarlo.",
      };

    case "success": {
      const workspacePath = `/workspaces/${result.task.workspaceId}`;
      const parentPath = result.task.parentId
        ? `/tasks/${result.task.parentId}`
        : null;

      revalidatePath(workspacePath);
      revalidatePath("/areas/[id]", "page");

      if (parentPath) {
        revalidatePath(parentPath);
      }

      redirect(parentPath ?? workspacePath);
    }
  }
}
