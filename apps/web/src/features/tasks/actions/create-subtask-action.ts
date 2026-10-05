"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createTaskSchema, taskSchema } from "../schemas/tasks.schema";
import { createTask } from "../tasks.service";
import type { CreateTaskState } from "./create-task-action";

export async function createSubtaskAction(
  workspaceId: string,
  parentId: string,
  _previousState: CreateTaskState,
  formData: FormData,
): Promise<CreateTaskState> {
  const parentValidation = taskSchema.shape.id.safeParse(parentId);

  if (!parentValidation.success) {
    return {
      error:
        "La tarea principal no es válida. Regresa a su detalle e intenta nuevamente.",
    };
  }

  const validation = createTaskSchema.safeParse({
    workspaceId,
    parentId: parentValidation.data,
    title: formData.get("title"),
    description: formData.get("description"),
    priority: formData.get("priority"),
    dueAt: formData.get("dueAt"),
    responsibleIds: formData.getAll("responsibleIds"),
    collaboratorIds: formData.getAll("collaboratorIds"),
  });

  if (!validation.success) {
    const fieldErrors: NonNullable<CreateTaskState["fieldErrors"]> = {};

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

    const invalidContext = validation.error.issues.some(
      (issue) =>
        issue.path[0] === "workspaceId" || issue.path[0] === "parentId",
    );

    return {
      error: invalidContext
        ? "El espacio o la tarea principal no son válidos. Regresa al detalle."
        : "Revisa los campos indicados.",
      fieldErrors,
    };
  }

  const result = await createTask(validation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error: "No tienes permiso para crear esta subtarea.",
      };

    case "not-found":
      return {
        error:
          "La tarea principal o su espacio no están disponibles, o ya no tienes acceso.",
      };

    case "invalid":
      return {
        error:
          "Revisa la entrega y las asignaciones. La principal debe estar sin completar y los participantes deben pertenecer a ella y ser miembros activos del espacio. Si eres empleado, debes incluirte como responsable o colaborador.",
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar la creación. Revisa las subtareas de la principal antes de volver a intentarlo.",
      };

    case "success": {
      const parentPath = `/tasks/${parentValidation.data}`;

      revalidatePath(parentPath);
      redirect(parentPath);
    }
  }
}
