"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { taskSchema, updateTaskStatusSchema } from "../schemas/tasks.schema";
import { updateStatusTask } from "../tasks.service";

export type UpdateTaskStatusState = {
  error: string;
  success?: string;
  fieldErrors?: {
    status?: string[];
  };
};

export async function updateTaskStatusAction(
  taskId: string,
  _previousState: UpdateTaskStatusState,
  formData: FormData,
): Promise<UpdateTaskStatusState> {
  const taskIdValidation = taskSchema.shape.id.safeParse(taskId);

  if (!taskIdValidation.success) {
    return {
      error: "El identificador de la tarea no es válido.",
    };
  }

  const validation = updateTaskStatusSchema.safeParse({
    status: formData.get("status"),
  });

  if (!validation.success) {
    return {
      error: "Selecciona un estado válido.",
      fieldErrors: {
        status: validation.error.issues.map((issue) => issue.message),
      },
    };
  }

  const result = await updateStatusTask(taskIdValidation.data, validation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error:
          "No tienes permiso para realizar este cambio. Solo un administrador puede completar o reabrir una tarea.",
      };

    case "not-found":
      return {
        error: "La tarea no existe o ya no tienes acceso a ella.",
      };

    case "invalid":
      return {
        error: "Revisa el estado seleccionado.",
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar el cambio. Recarga la tarea para comprobar su estado antes de volver a intentarlo.",
      };

    case "success": {
      revalidatePath(`/tasks/${result.task.id}`);
      revalidatePath(`/tasks/${result.task.id}/edit`);
      revalidatePath(`/workspaces/${result.task.workspaceId}`);
      revalidatePath("/areas/[id]", "page");

      if (result.task.parentId) {
        revalidatePath(`/tasks/${result.task.parentId}`);
      }

      return {
        error: "",
        success: "Estado actualizado correctamente.",
      };
    }
  }
}
