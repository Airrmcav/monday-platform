import "server-only";
import {
  Area,
  areaSchema,
  AreasResponse,
  areasResponseSchema,
  CreateAreaInput,
  createAreaSchema,
} from "../schemas/areas.schemas";
import { createClient } from "@/lib/supabase/server";
import { unknown } from "zod";

export type GetAreasResult =
  | { status: "success"; result: AreasResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export type CreateAreaResult =
  | { status: "success"; area: Area }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "conflict" }
  | { status: "invalid" }
  | { status: "unavailable" };

function getApiUrl(): string {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL");
  }
  return apiUrl.replace(/\/+$/, "");
}

async function getAccessToken(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session.access_token;
}

export async function getAreas(): Promise<GetAreasResult> {
  const apiUrl = process.env.API_URL;
  const token = await getAccessToken();

  if (!token) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl}/areas`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
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

  if (response.status !== 200) {
    return { status: "unavailable" };
  }
  let payload = unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const validation = areasResponseSchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    result: validation.data,
  };
}

export async function createArea(
  input: CreateAreaInput,
): Promise<CreateAreaResult> {
  const validation = createAreaSchema.safeParse(input);

  if (!validation.success) {
    return {
      status: "invalid",
    };
  }

  const apiUrl = process.env.API_URL;
  const token = await getAccessToken();

  if (!token) {
    return {
      status: "unauthenticated",
    };
  }
  let response: Response;

  try {
    response = await fetch(`${apiUrl}/areas`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(validation.data),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return {
      status: "unavailable",
    };
  }

  switch (response.status) {
    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 409:
      return { status: "conflict" };

    case 400:
      return { status: "invalid" };
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

  const areaValidation = areaSchema.safeParse(payload);

  if (!areaValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    area: areaValidation.data,
  };
}
