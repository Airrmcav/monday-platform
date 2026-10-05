"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createWorkspaceSchema } from "../schemas/workspaces.schemas";
import { createWorkspace } from "../services/workspaces.service";

export type CreateWorkspaceState = {
  error: string;
  fieldErrors?: {
    name?: string[];
    description?: string[];
    memberIds?: string[];
  };
};

export async function createWorkspaceAction(
  areaId: string,
  _previousState: CreateWorkspaceState,
  formData: FormData,
): Promise<CreateWorkspaceState> {
  const validation = createWorkspaceSchema.safeParse({
    areaId,
    name: formData.get("name"),
    description: formData.get("description") ?? undefined,
    memberIds: formData.getAll("memberIds"),
  });

  if (!validation.success) {
    console.info(
      "[createWorkspaceAction] Validación:",
      validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );
    const fieldErrors: NonNullable<CreateWorkspaceState["fieldErrors"]> = {};

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

    const invalidArea = validation.error.issues.some(
      (issue) => issue.path[0] === "areaId",
    );

    return {
      error: invalidArea
        ? "El área no es válida. Regresa al listado de áreas."
        : "Revisa los campos indicados.",
      fieldErrors,
    };
  }

  const result = await createWorkspace(validation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error: "Solo los administradores pueden crear espacios.",
      };

    case "not-found":
      return {
        error: "El área ya no existe. Regresa al listado y selecciona otra.",
      };

    case "conflict":
      return {
        error: "No puedes crear espacios en un área archivada.",
      };

    case "invalid":
      return {
        error:
          "Revisa los datos y los miembros seleccionados. Todos deben existir y estar activos.",
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar la creación. Revisa los espacios del área antes de volver a intentarlo.",
      };

    case "success": {
      const areaPath = `/areas/${result.workspace.areaId}`;

      revalidatePath(areaPath);
      revalidatePath("/areas");
      redirect(areaPath);
    }
  }
}
