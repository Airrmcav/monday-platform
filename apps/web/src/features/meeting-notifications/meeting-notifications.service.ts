import "server-only";

import { createApiClient } from "@/lib/api-client";
import {
  meetingNotificationSchema,
  meetingNotificationsResponseSchema,
} from "./schemas/meeting-notifications.schema";

export type MeetingNotificationsResult =
  | {
      status: "success";
      data: ReturnType<typeof meetingNotificationsResponseSchema.parse>;
    }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

async function requestApi(path: string, method?: "PATCH") {
  const api = await createApiClient();
  if (api.status === "unauthenticated") {
    return { status: "unauthenticated" as const };
  }

  let response: Response;
  try {
    response = await api.request(
      path,
      {
        ...(method ? { method } : {}),
      },
      10_000,
    );
  } catch (error) {
    console.error("[meeting-notifications] Falló la petición al API:", {
      path,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
    return { status: "unavailable" as const };
  }

  if (response.status === 401) return { status: "unauthenticated" as const };
  if (response.status === 403) return { status: "forbidden" as const };
  if (response.status === 404) return { status: "not-found" as const };
  if (!response.ok) return { status: "unavailable" as const };

  if (method) {
    return { status: "success" as const };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" as const };
  }

  const validation = meetingNotificationsResponseSchema.safeParse(payload);
  if (!validation.success) {
    console.error(
      "[meeting-notifications] La respuesta del API no cumple el esquema:",
      validation.error.issues.map(({ path, message }) => ({ path, message })),
    );
    return { status: "unavailable" as const };
  }

  return { status: "success" as const, data: validation.data };
}

export async function getMeetingNotifications(): Promise<MeetingNotificationsResult> {
  const result = await requestApi("/meeting-notifications");
  if (result.status !== "success" || !("data" in result) || !result.data) {
    return result.status === "success" ? { status: "unavailable" } : result;
  }

  return { status: "success", data: result.data };
}

export async function markMeetingNotificationAsRead(id: string) {
  const validation = meetingNotificationSchema.shape.id.safeParse(id);
  if (!validation.success) return { status: "not-found" as const };
  return requestApi(`/meeting-notifications/${validation.data}/read`, "PATCH");
}

export async function markAllMeetingNotificationsAsRead() {
  return requestApi("/meeting-notifications/read-all", "PATCH");
}
