import "server-only";

import { createClient } from "@/lib/supabase/server";

import {
  taskNotificationSchema,
  taskNotificationsResponseSchema,
  type TaskNotificationsResponse,
} from "./schemas/task-notifications.schema";

type GetTaskNotificationsOptions = {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
};

export type GetTaskNotificationsResult =
  | {
      status: "success";
      result: TaskNotificationsResponse;
    }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export async function getTaskNotifications({
  page = 1,
  pageSize = 8,
  unreadOnly = false,
}: GetTaskNotificationsOptions = {}): Promise<GetTaskNotificationsResult> {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50
  ) {
    return { status: "unavailable" };
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

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    unreadOnly: String(unreadOnly),
  });

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/task-notifications?${query}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
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

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const validation = taskNotificationsResponseSchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    result: validation.data,
  };
}

export type MarkTaskNotificationAsReadResult =
  | { status: "success" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

export async function markTaskNotificationAsRead(
  notificationId: string,
): Promise<MarkTaskNotificationAsReadResult> {
  const validation = taskNotificationSchema.shape.id.safeParse(notificationId);

  if (!validation.success) {
    return { status: "not-found" };
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
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/task-notifications/${validation.data}/read`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
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

  if (response.status === 404) {
    return { status: "not-found" };
  }

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  return { status: "success" };
}

export type MarkAllTaskNotificationsAsReadResult =
  | { status: "success" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "unavailable" };

export async function markAllTaskNotificationsAsRead(): Promise<MarkAllTaskNotificationsAsReadResult> {
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
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/task-notifications/read-all`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
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

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  return { status: "success" };
}
