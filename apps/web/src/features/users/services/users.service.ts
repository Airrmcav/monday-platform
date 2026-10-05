import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  CreateUserInput,
  createUserSchema,
  UserListItem,
  userListItemSchema,
  usersResponseSchema,
  type UsersResponse,
  type UpdateUserInput,
  updateUserSchema,
} from "../schemas/users.schemas";

export type UsersResult =
  | { status: "success"; result: UsersResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export type CreateUserResult =
  | { status: "success"; user: UserListItem }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "conflict" }
  | { status: "invalid"; message: string }
  | { status: "unavailable" };

export type UpdateUserResult =
  | { status: "success"; user: UserListItem }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "conflict"; message: string }
  | { status: "invalid"; message: string }
  | { status: "unavailable" };

export type GetUserResult =
  | { status: "success"; user: UserListItem }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

type GetUsersOptions = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
};

export async function getUsers({
  page = 1,
  pageSize = 10,
  search = "",
  status,
}: GetUsersOptions = {}): Promise<UsersResult> {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100 ||
    !Number.isSafeInteger((page - 1) * pageSize)
  ) {
    throw new Error("Parámetros de paginación inválidos.");
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  const normalizedSearch = search.trim();

  if (normalizedSearch.length > 120) {
    throw new Error("La búsqueda no puede supear los 120 carácteres.");
  }

  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (status !== undefined) {
    searchParams.set("status", status);
  }

  if (normalizedSearch) {
    searchParams.set("search", normalizedSearch);
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/users?${searchParams}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  if (response.status === 401) {
    return { status: "unauthenticated" };
  }

  if (response.status === 403) {
    return { status: "forbidden" };
  }

  if (!response.ok) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const validation = usersResponseSchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    result: validation.data,
  };
}

export async function createUser(
  input: CreateUserInput,
): Promise<CreateUserResult> {
  const validation = createUserSchema.safeParse(input);

  if (!validation.success) {
    return {
      status: "invalid",
      message: "Revisa los datos del usuario.",
    };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl.replace(/\/+$/, "")}/users`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(validation.data),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return { status: "unavailable" };
  }

  if (response.status === 401) {
    return { status: "unauthenticated" };
  }

  if (response.status === 403) {
    return { status: "forbidden" };
  }

  if (response.status === 409) {
    return { status: "conflict" };
  }

  if (response.status === 400) {
    return {
      status: "invalid",
      message:
        "El servidor rechazó los datos. Revisa el correo y los requisitos de la contraseña.",
    };
  }

  if (response.status !== 201) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const userValidation = userListItemSchema.safeParse(payload);

  if (!userValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    user: userValidation.data,
  };
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<UpdateUserResult> {
  const idValidation = userListItemSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return {
      status: "invalid",
      message: "El identificador del usuario no es válido.",
    };
  }
  const validation = updateUserSchema.safeParse(input);

  if (!validation.success) {
    return {
      status: "invalid",
      message: "Revisa los datos que deseas actualizar.",
    };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return {
      status: "unauthenticated",
    };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/users/${encodeURIComponent(idValidation.data)}`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(validation.data),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }
  switch (response.status) {
    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };

    case 409:
      return {
        status: "conflict",
        message:
          "No puedes desactivar ni quitar permisos al último administrador activo.",
      };

    case 400:
      return {
        status: "invalid",
        message: "El servidor rechazó los datos de actualización.",
      };
  }
  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const userValidation = userListItemSchema.safeParse(payload);

  if (!userValidation.success) {
    return { status: "unavailable" };
  }
  return {
    status: "success",
    user: userValidation.data,
  };
}

export async function getUser(id: string): Promise<GetUserResult> {
  const idValidation = userListItemSchema.shape.id.safeParse(id);
  if (!idValidation.success) {
    return {
      status: "not-found",
    };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL");
  }
  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return {
      status: "unauthenticated",
    };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/users/${encodeURIComponent(idValidation.data)}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }
  switch (response.status) {
    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 400:
    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return {
      status: "unavailable",
    };
  }

  const validation = userListItemSchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    user: validation.data,
  };
}
