"use server";
import { createTaskSchema } from "../schemas/tasks.schema";
import { createTask } from "../tasks.service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type CreateTaskState = {
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

export async function createTaskAction(
  workspaceId: string,
  _previousState: CreateTaskState,
  formData: FormData,
): Promise<CreateTaskState> {
  const validation = createTaskSchema.safeParse({
    workspaceId,
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

    const invalidWorkspace = validation.error.issues.some(
      (issue) => issue.path[0] === "workspaceId",
    );

    return {
      error: invalidWorkspace
        ? "El espacio no es válido. Regresa al listado de áreas."
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
        error: "No tienes permiso para crear esta tarea.",
      };

    case "not-found":
      return {
        error:
          "El espacio no existe o ya no tienes acceso. Regresa al listado de áreas.",
      };

    case "invalid":
      return {
        error:
          "Revisa los datos y las asignaciones. Los participantes deben ser miembros activos del espacio. Si eres empleado, debes incluirte como responsable o colaborador.",
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar la creación. Revisa las tareas del espacio antes de volver a intentarlo.",
      };

    case "success": {
      const workspacePath = `/workspaces/${result.task.workspaceId}`;

      revalidatePath(workspacePath);
      redirect(workspacePath);
    }
  }
}
