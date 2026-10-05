"use server";

import { revalidatePath } from "next/cache";
import { updateWorkspaceSchema } from "../schemas/workspaces.schemas";
import { updateWorkspace } from "../services/workspaces.service";
import { redirect } from "next/navigation";

export type UpdateWorkspaceState = {
  error: string;
  fieldErrors?: {
    name?: string[];
    description?: string[];
    memberIds?: string[];
  };
};

export async function updateWorkspaceAction(
  workspaceId: string,
  _previousState: UpdateWorkspaceState,
  formData: FormData,
): Promise<UpdateWorkspaceState> {
  const validation = updateWorkspaceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    memberIds: formData.getAll("memberIds"),
  });

  if (!validation.success) {
    const fieldErrors: NonNullable<UpdateWorkspaceState["fieldErrors"]> = {};

    for (const issue of validation.error.issues) {
      const field = issue.path[0];

      if (
        field === "name" ||
        field === "description" ||
        field === "memberIds"
      ) {
        const messages = fieldErrors[field] ?? [];

        messages.push(issue.message);
        fieldErrors[field] = messages;
      }
    }
    return {
      error: "Revisa los campos indicados",
      fieldErrors,
    };
  }

  const result = await updateWorkspace(workspaceId, validation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error:
          "Solo los administradores activos pueden editar espacios de trabajo.",
      };

    case "not-found":
      return {
        error:
          "El espacio no existe o ya no está disponible. Regresa al listado de áreas.",
      };

    case "invalid":
      return {
        error:
          "Revisa los datos del espacio y los miembros seleccionados. Los usuarios que agregues deben estar activos.",
      };

    case "conflict":
      return {
        error:
          "No puedes retirar miembros que siguen asignados a tareas o subtareas no archivadas.",
        fieldErrors: {
          memberIds: [
            "Reasigna o retira primero sus participaciones antes de eliminarlos del espacio.",
          ],
        },
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar la actualización. Revisa los datos del espacio antes de volver a intentarlo.",
      };

    case "success": {
      const workspacePath = `/workspaces/${result.workspace.id}`;
      const areaPath = `/areas/${result.workspace.areaId}`;

      revalidatePath(workspacePath);
      revalidatePath(`${workspacePath}/edit`);
      revalidatePath(areaPath);
      revalidatePath("/tasks/[id]", "page");

      redirect(workspacePath);
    }
  }
}
