"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateUserSchema, userListItemSchema } from "../schemas/users.schemas";
import { updateUser } from "../services/users.service";

export type UpdateUserState = {
  error: string;
  fieldErrors?: {
    name?: string[];
    isAdmin?: string[];
    status?: string[];
  };
};

export async function updateUserAction(
  id: string,
  _previousState: UpdateUserState,
  formData: FormData,
): Promise<UpdateUserState> {
  const idValidation = userListItemSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return {
      error: "El identificador del usuario no es válido.",
    };
  }

  const adminValue = formData.get("isAdmin");

  const validation = updateUserSchema.safeParse({
    name: formData.get("name"),
    isAdmin:
      adminValue === "true"
        ? true
        : adminValue === "false"
          ? false
          : adminValue,
    status: formData.get("status"),
  });

  if (!validation.success) {
    const fieldErrors: NonNullable<UpdateUserState["fieldErrors"]> = {};

    for (const issue of validation.error.issues) {
      const field = issue.path[0];

      if (field === "name" || field === "isAdmin" || field === "status") {
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

  const result = await updateUser(idValidation.data, validation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error: "Solo los administradores pueden modificar usuarios.",
      };

    case "not-found":
      return {
        error: "El usuario ya no existe. Regresa a la lista de usuarios.",
      };

    case "conflict":
    case "invalid":
      return {
        error: result.message,
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar la actualización. Revisa el estado del usuario antes de volver a intentarlo.",
      };

    case "success":
      revalidatePath("/users");
      revalidatePath(`/users/${idValidation.data}/edit`);
      redirect("/users");
  }
}
