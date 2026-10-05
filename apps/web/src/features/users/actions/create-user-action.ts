"use server";

import { revalidatePath } from "next/cache";
import { createUserSchema } from "../schemas/users.schemas";
import { createUser } from "../services/users.service";
import { redirect } from "next/navigation";

export type CreateUserState = {
  error: string;
  fieldErrors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    isAdmin?: string[];
  };
};

export async function createUserAction(
  _previousState: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const adminValue = formData.get("isAdmin");
  const validation = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    isAdmin:
      adminValue === "true"
        ? true
        : adminValue === "false"
          ? false
          : adminValue,
  });

  if (!validation.success) {
    const fieldErrors: NonNullable<CreateUserState["fieldErrors"]> = {};

    for (const issue of validation.error.issues) {
      const field = issue.path[0];

      if (
        field === "name" ||
        field === "email" ||
        field === "password" ||
        field === "isAdmin"
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

  const result = await createUser(validation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        error: "Solo los administradores pueden crear usuarios.",
      };

    case "conflict":
      return {
        error: "Ya existe una cuenta con ese correo.",
        fieldErrors: {
          email: ["Utiliza un correo que no esté registrado."],
        },
      };

    case "invalid":
      return {
        error: result.message,
      };

    case "unavailable":
      return {
        error:
          "No pudimos confirmar la creación. Revisa la lista de usuarios antes de volver a intentarlo.",
      };

    case "success":
      revalidatePath("/users");
      redirect("/users");
  }
}
