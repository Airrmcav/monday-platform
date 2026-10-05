"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAreaSchema } from "../schemas/areas.schemas";
import { createArea } from "../services/areas.service";

export type CreateAreaState = {
  error: string;
  fieldErrors?: {
    name?: string[];
  };
};

export async function createAreaAction(
  _previousState: CreateAreaState,
  formData: FormData,
): Promise<CreateAreaState> {
  const validation = createAreaSchema.safeParse({
    name: formData.get("name"),
  });

  if (!validation.success) {
    const fieldErrors: NonNullable<CreateAreaState["fieldErrors"]> = {};

    for (const issue of validation.error.issues) {
      const field = issue.path[0];

      if (field === "name") {
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

  const result = await createArea(validation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error: "Solo los administradores pueden crear áreas.",
      };

    case "conflict":
      return {
        error: "Ya existe un área con ese nombre, activa o archivada.",
        fieldErrors: {
          name: ["Utiliza otro nombre o revisa el área existente."],
        },
      };

    case "invalid":
      return {
        error: "El servidor rechazó los datos. Revisa el nombre del área.",
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar la creación. Revisa la lista de áreas antes de volver a intentarlo.",
      };

    case "success":
      revalidatePath("/areas");
      redirect("/areas");
  }
}
