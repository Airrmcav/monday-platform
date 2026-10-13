import "server-only";
import {
  Area,
  areaSchema,
  AreasResponse,
  areasResponseSchema,
  CreateAreaInput,
  createAreaSchema,
} from "../schemas/areas.schemas";
import { createApiClient } from "@/lib/api-client";
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

export async function getAreas(): Promise<GetAreasResult> {
  const api = await createApiClient();

  if (api.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await api.request("/areas", {}, 10_000);
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

  const api = await createApiClient();

  if (api.status === "unauthenticated") {
    return {
      status: "unauthenticated",
    };
  }
  let response: Response;

  try {
    response = await api.request(
      "/areas",
      {
        method: "POST",
        body: JSON.stringify(validation.data),
      },
      15_000,
    );
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
