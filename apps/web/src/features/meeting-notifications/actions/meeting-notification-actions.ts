"use server";

import { redirect } from "next/navigation";
import { getMeetingNotifications } from "../meeting-notifications.service";
import {
  markAllMeetingNotificationsAsRead,
  markMeetingNotificationAsRead,
} from "../meeting-notifications.service";

export type MeetingNotificationActionResult =
  | { success: true }
  | { success: false; error: string };

export async function refreshMeetingNotificationsAction() {
  const result = await getMeetingNotifications();
  switch (result.status) {
    case "unauthenticated":
      redirect("/login");
    case "forbidden":
      return {
        success: false as const,
        error: "No tienes permiso para ver estas notificaciones.",
      };
    case "not-found":
    case "unavailable":
      return {
        success: false as const,
        error: "No pudimos actualizar las notificaciones de reuniones.",
      };
    case "success":
      return {
        success: true as const,
        notifications: result.data.data,
        unreadCount: result.data.unreadCount,
      };
  }
}

export async function markMeetingNotificationReadAction(id: string) {
  const result = await markMeetingNotificationAsRead(id);

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");
    case "forbidden":
      return {
        success: false,
        error: "No tienes permiso para modificar esta notificación.",
      } satisfies MeetingNotificationActionResult;
    case "not-found":
      return {
        success: false,
        error: "La notificación ya no está disponible.",
      } satisfies MeetingNotificationActionResult;
    case "unavailable":
      return {
        success: false,
        error: "No pudimos actualizar la notificación. Intenta nuevamente.",
      } satisfies MeetingNotificationActionResult;
    case "success":
      return { success: true } satisfies MeetingNotificationActionResult;
  }
}

export async function markAllMeetingNotificationsReadAction() {
  const result = await markAllMeetingNotificationsAsRead();

  switch (result.status) {
    case "unauthenticated":
      redirect("/login");
    case "forbidden":
      return {
        success: false,
        error: "No tienes permiso para modificar tus notificaciones.",
      } satisfies MeetingNotificationActionResult;
    case "not-found":
    case "unavailable":
      return {
        success: false,
        error: "No pudimos actualizar las notificaciones. Intenta nuevamente.",
      } satisfies MeetingNotificationActionResult;
    case "success":
      return { success: true } satisfies MeetingNotificationActionResult;
  }
}
