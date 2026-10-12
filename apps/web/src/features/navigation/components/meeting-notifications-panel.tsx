"use client";

import Link from "next/link";
import { CalendarDays, Check, CheckCheck, Video, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  markAllMeetingNotificationsReadAction,
  markMeetingNotificationReadAction,
  refreshMeetingNotificationsAction,
} from "@/features/meeting-notifications/actions/meeting-notification-actions";
import type { MeetingNotification } from "@/features/meeting-notifications/schemas/meeting-notifications.schema";

type MeetingNotificationsPanelProps = {
  initialNotifications: MeetingNotification[];
  initialUnreadCount: number;
  unavailable: boolean;
};

export default function MeetingNotificationsPanel({
  initialNotifications,
  initialUnreadCount,
  unavailable,
}: MeetingNotificationsPanelProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loadUnavailable, setLoadUnavailable] = useState(unavailable);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function closePanel() {
    dialogRef.current?.close();
  }

  function markAsRead(notificationId: string) {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    const target = notifications.find(({ id }) => id === notificationId);

    if (!target || target.readAt) return;

    setError("");
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, readAt: new Date().toISOString() }
          : notification,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - 1));

    startTransition(async () => {
      const result = await markMeetingNotificationReadAction(notificationId);
      if (!result.success) {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
        setError(result.error);
      }
    });
  }

  function markAllAsRead() {
    if (unreadCount === 0) return;

    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    const readAt = new Date().toISOString();

    setError("");
    setNotifications((current) =>
      current.map((notification) =>
        notification.readAt ? notification : { ...notification, readAt },
      ),
    );
    setUnreadCount(0);

    startTransition(async () => {
      const result = await markAllMeetingNotificationsReadAction();
      if (!result.success) {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
        setError(result.error);
      }
    });
  }

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  useEffect(() => {
    let active = true;

    async function refreshNotifications() {
      const result = await refreshMeetingNotificationsAction();
      if (active && result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.unreadCount);
        setLoadUnavailable(false);
      } else if (active) {
        setLoadUnavailable(true);
      }
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshNotifications();
      }
    }, 60_000);
    window.addEventListener("focus", refreshNotifications);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshNotifications);
    };
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={
          unreadCount > 0
            ? `Abrir notificaciones de reuniones, ${unreadCount} sin leer`
            : "Abrir notificaciones de reuniones"
        }
        aria-haspopup="dialog"
        aria-controls="meeting-notifications-panel"
        title="Notificaciones de reuniones"
        onClick={() => dialogRef.current?.showModal()}
        className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Video aria-hidden="true" size={21} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e2445c] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        id="meeting-notifications-panel"
        aria-labelledby="meeting-notifications-title"
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) closePanel();
        }}
        className="fixed inset-y-0 left-auto right-0 m-0 ml-auto h-dvh max-h-none w-full max-w-md border-0 bg-surface p-0 text-foreground shadow-2xl backdrop:bg-brand-navy/35"
      >
        <div className="flex h-20 items-center justify-between gap-3 border-b border-border/60 px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Video aria-hidden="true" size={21} />
            </span>
            <div className="min-w-0">
              <h2 id="meeting-notifications-title" className="text-lg font-semibold">
                Reuniones
              </h2>
              <p className="text-xs text-muted-foreground">
                {unreadCount === 0 ? "Estás al día" : `${unreadCount} sin leer`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={unreadCount === 0 || isPending}
              onClick={markAllAsRead}
              className="rounded-lg px-2.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              Marcar todas
            </button>
            <button
              type="button"
              aria-label="Cerrar notificaciones de reuniones"
              onClick={closePanel}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-surface-muted hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
            >
              <X aria-hidden="true" size={20} />
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="border-b border-danger/20 bg-danger-soft px-5 py-3 text-sm text-danger sm:px-6"
          >
            {error}
          </p>
        )}
        {loadUnavailable && (
          <p
            role="status"
            className="border-b border-border px-5 py-3 text-sm text-muted-foreground sm:px-6"
          >
            No pudimos cargar las notificaciones de reuniones.
          </p>
        )}

        <div className="h-[calc(100dvh-5rem)] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-muted-foreground">
                <CalendarDays aria-hidden="true" size={26} />
              </span>
              <h3 className="mt-4 font-semibold">No tienes avisos de reuniones</h3>
              <p className="mt-1 max-w-xs text-sm leading-6 text-muted-foreground">
                Aquí aparecerán los recordatorios del día anterior y del día de
                cada reunión.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`flex gap-3 px-5 py-4 transition-colors sm:px-6 ${
                    notification.readAt ? "" : "bg-primary/5"
                  }`}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Video aria-hidden="true" size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href="/meetings"
                      onClick={() => markAsRead(notification.id)}
                      className="block rounded-sm focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <p className="text-sm font-semibold">
                        {notification.type === "DAY_BEFORE"
                          ? "Tienes una reunión programada"
                          : `Tienes una reunión hoy a las ${formatMeetingTime(notification)}`}
                      </p>
                      <p className="mt-1 truncate text-sm text-foreground">
                        {notification.meeting.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatMeetingDate(notification)}
                        {notification.meeting.status === "CANCELLED" &&
                          " · Cancelada"}
                      </p>
                    </Link>
                  </div>
                  {!notification.readAt && (
                    <button
                      type="button"
                      aria-label="Marcar aviso como leído"
                      disabled={isPending}
                      onClick={() => markAsRead(notification.id)}
                      className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition hover:bg-surface-hover hover:text-primary disabled:opacity-50"
                    >
                      <Check aria-hidden="true" size={17} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {notifications.length > 0 && (
            <div className="border-t border-border/60 p-5 text-center">
              <Link
                href="/meetings"
                onClick={closePanel}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary-soft"
              >
                <CheckCheck aria-hidden="true" size={16} />
                Ver calendario de reuniones
              </Link>
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

function formatMeetingDate(notification: MeetingNotification) {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: notification.meeting.timeZone,
  }).format(new Date(notification.meeting.startsAt));
}

function formatMeetingTime(notification: MeetingNotification) {
  return new Intl.DateTimeFormat("es-MX", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: notification.meeting.timeZone,
  }).format(new Date(notification.meeting.startsAt));
}
