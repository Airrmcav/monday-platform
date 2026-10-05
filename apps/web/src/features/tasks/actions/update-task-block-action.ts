"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { taskSchema, updateTaskBlockSchema } from "../schemas/tasks.schema";
import { updateBlockTask } from "../tasks.service";

export type UpdateTaskBlockState = {
  error: string;
  success?: string;
  fieldErrors?: {
    blockedReason?: string[];
  };
};

export async function updateTaskBlockAction(
  taskId: string,
  _previousState: UpdateTaskBlockState,
  formData: FormData,
): Promise<UpdateTaskBlockState> {
  const taskIdValidation = taskSchema.shape.id.safeParse(taskId);

  if (!taskIdValidation.success) {
    return {
      error: "El identificador de la tarea no es válido.",
    };
  }
  const operation = formData.get("operation");

  if (operation !== "block" && operation !== "unblock") {
    return {
      error: "Selecciona una operación válida.",
    };
  }

  const input =
    operation === "block"
      ? {
          isBlocked: true,
          blockedReason: formData.get("blockedReason"),
        }
      : {
          isBlocked: false,
        };

  const validation = updateTaskBlockSchema.safeParse(input);

  if (!validation.success) {
    const reasonErrors = validation.error.issues
      .filter((issue) => issue.path[0] === "blockedReason")
      .map((issue) => issue.message);

    return {
      error: "Revisa los datos del bloqueo.",
      fieldErrors: {
        blockedReason: reasonErrors,
      },
    };
  }

  const result = await updateBlockTask(taskIdValidation.data, validation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error: "No tienes permiso para modificar el bloqueo de esta tarea.",
      };

    case "not-found":
      return {
        error: "La tarea no existe o ya no tienes acceso a ella.",
      };

    case "invalid":
      return {
        error: "Revisa el motivo. No puedes bloquear una tarea completada.",
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar el cambio. Recarga la tarea para comprobar el bloqueo antes de volver a intentarlo.",
      };

    case "success": {
      revalidatePath(`/tasks/${result.task.id}`);
      revalidatePath(`/workspaces/${result.task.workspaceId}`);
      revalidatePath("/areas/[id]", "page");

      if (result.task.parentId) {
        revalidatePath(`/tasks/${result.task.parentId}`);
      }

      return {
        error: "",
        success: result.task.isBlocked
          ? "Bloqueo guardado correctamente."
          : "Tarea desbloqueada correctamente.",
      };
    }
  }
}
