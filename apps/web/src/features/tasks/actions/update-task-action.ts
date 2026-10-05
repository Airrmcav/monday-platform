"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { taskSchema, updateTaskSchema } from "../schemas/tasks.schema";
import { updateTask } from "../tasks.service";

export type UpdateTaskState = {
  error: string;
  fieldErrors?: {
    title?: string[];
    description?: string[];
    priority?: string[];
    dueAt?: string[];
    responsibleIds?: string[];
    collaboratorIds?: string[];
  };
};

export async function updateTaskAction(
  taskId: string,
  _previousState: UpdateTaskState,
  formData: FormData,
): Promise<UpdateTaskState> {
  const taskIdValidation = taskSchema.shape.id.safeParse(taskId);

  if (!taskIdValidation.success) {
    return {
      error: "El identificador de la tarea no es válido.",
    };
  }
  const validation = updateTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    dueAt: formData.get("dueAt"),
    responsibleIds: formData.getAll("responsibleIds"),
    collaboratorIds: formData.getAll("collaboratorIds"),
  });

  if (!validation.success) {
    const fieldErrors: NonNullable<UpdateTaskState["fieldErrors"]> = {};

    for (const issue of validation.error.issues) {
      const field = issue.path[0];

      if (
        field === "title" ||
        field === "description" ||
        field === "priority" ||
        field === "dueAt" ||
        field === "responsibleIds" ||
        field === "collaboratorIds"
      ) {
        const messages = fieldErrors[field] ?? [];
        messages.push(issue.message);
        fieldErrors[field] = messages;
      }
    }

    return {
      error: "Revisa los campos indicados.",
      fieldErrors,
    };
  }

  const result = await updateTask(taskIdValidation.data, validation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error:
          "No tienes permiso para editar esta tarea. Solo pueden hacerlo un administrador o un responsable con acceso activo.",
      };

    case "not-found":
      return {
        error: "La tarea no existe o ya no tienes acceso a ella.",
      };

    case "invalid":
      return {
        error:
          "No se pudieron guardar los cambios. La tarea debe estar sin completar, la entrega no puede ser anterior al inicio y los participantes deben ser miembros activos del espacio, con al menos un responsable y sin roles duplicados.",
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar la actualización. Revisa la tarea antes de volver a intentarlo.",
      };

    case "success": {
      const taskPath = `/tasks/${result.task.id}`;
      const workspacePath = `/workspaces/${result.task.workspaceId}`;

      const parentPath = result.task.parentId
        ? `/tasks/${result.task.parentId}`
        : null;

      revalidatePath(taskPath);
      revalidatePath(`${taskPath}/edit`);
      revalidatePath(workspacePath);
      revalidatePath("/areas/[id]", "page");

      if (parentPath) {
        revalidatePath(parentPath);
      }

      redirect(parentPath ?? workspacePath);
    }
  }
}
