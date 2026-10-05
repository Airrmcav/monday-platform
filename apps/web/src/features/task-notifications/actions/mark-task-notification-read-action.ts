"use server";

import { redirect } from "next/navigation";

import { taskNotificationSchema } from "../schemas/task-notifications.schema";
import { markTaskNotificationAsRead } from "../task-notifications.service";

export type MarkTaskNotificationReadActionResult =
  | { success: true }
  | {
      success: false;
      error: string;
    };

export async function markTaskNotificationReadAction(
  notificationId: string,
): Promise<MarkTaskNotificationReadActionResult> {
  const validation = taskNotificationSchema.shape.id.safeParse(notificationId);

  if (!validation.success) {
    return {
      success: false,
      error: "La notificación no es válida.",
    };
  }

  const result = await markTaskNotificationAsRead(validation.data);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");

    case "forbidden":
      return {
        success: false,
        error: "No tienes permiso para modificar esta notificación.",
      };

    case "not-found":
      return {
        success: false,
        error: "La notificación ya no está disponible.",
      };

    case "unavailable":
      return {
        success: false,
        error: "No pudimos actualizar la notificación. Intenta nuevamente.",
      };

    case "success":
      return {
        success: true,
      };
  }
}
