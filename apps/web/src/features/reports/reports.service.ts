import "server-only";

import { createApiClient } from "@/lib/api-client";
import { reportsDataSchema, type ReportsData } from "./schemas/reports.schema";

export type GetReportsDataResult =
  | { status: "success"; data: ReportsData }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export async function getReportsData(): Promise<GetReportsDataResult> {
  const api = await createApiClient();
  if (api.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }
  const apiUrl = api.baseUrl;

  let response: Response;

  try {
    response = await api.request(`${apiUrl}/reports`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
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

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const validation = reportsDataSchema.safeParse(payload);
  if (!validation.success) {
    return { status: "unavailable" };
  }

  return { status: "success", data: validation.data };
}
