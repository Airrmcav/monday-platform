"use server";

import { redirect } from "next/navigation";

import { markAllTaskNotificationsAsRead } from "../task-notifications.service";

export type MarkAllTaskNotificationsReadActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
    };

export async function markAllTaskNotificationsReadAction(): Promise<MarkAllTaskNotificationsReadActionResult> {
  const result = await markAllTaskNotificationsAsRead();

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        success: false,
        error: "No tienes permiso para modificar tus notificaciones.",
      };

    case "unavailable":
      return {
        success: false,
        error: "No pudimos actualizar las notificaciones. Intenta nuevamente.",
      };

    case "success":
      return {
        success: true,
      };
  }
}
