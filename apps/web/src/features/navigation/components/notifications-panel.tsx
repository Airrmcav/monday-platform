"use client";

import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  CircleAlert,
  Clock3,
  ChevronDown,
  Flag,
  MessageSquareText,
  Pencil,
  ShieldAlert,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname } from "next/navigation";

import { markAllTaskNotificationsReadAction } from "@/features/task-notifications/actions/mark-all-task-notifications-read-action";
import { markTaskNotificationReadAction } from "@/features/task-notifications/actions/mark-task-notification-read-action";
import type { TaskNotification } from "@/features/task-notifications/schemas/task-notifications.schema";
import { groupNotificationsByTask } from "@/features/task-notifications/group-notifications";

type NotificationsPanelProps = {
  initialNotifications: TaskNotification[];
  initialUnreadCount: number;
  unavailable: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

export default function NotificationsPanel({
  initialNotifications,
  initialUnreadCount,
  unavailable,
}: NotificationsPanelProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<Set<string>>(
    new Set(),
  );

  function closePanel() {
    dialogRef.current?.close();
  }

  function openPanel() {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
    }
  }

  function markAsRead(notificationId: string) {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    const target = notifications.find(
      (notification) => notification.id === notificationId,
    );

    if (!target || target.readAt) {
      return;
    }

    setError("");
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              readAt: new Date().toISOString(),
            }
          : notification,
      ),
    );
    setUnreadCount((currentCount) => Math.max(0, currentCount - 1));

    startTransition(async () => {
      const result = await markTaskNotificationReadAction(notificationId);

      if (!result.success) {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
        setError(result.error);
      }
    });
  }

  function markAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    const readAt = new Date().toISOString();

    setError("");
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) =>
        notification.readAt
          ? notification
          : {
              ...notification,
              readAt,
            },
      ),
    );
    setUnreadCount(0);

    startTransition(async () => {
      const result = await markAllTaskNotificationsReadAction();

      if (!result.success) {
        setNotifications(previousNotifications);
        setUnreadCount(previousUnreadCount);
        setError(result.error);
      }
    });
  }

  function toggleGroup(taskId: string) {
    setCollapsedTaskIds((current) => {
      const next = new Set(current);

      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }

      return next;
    });
  }

  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  const groups = groupNotificationsByTask(notifications);
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={
          unreadCount > 0
            ? `Abrir notificaciones, ${unreadCount} sin leer`
            : "Abrir notificaciones"
        }
        aria-haspopup="dialog"
        aria-controls="notifications-panel"
        title="Notificaciones"
        onClick={openPanel}
        className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Bell aria-hidden="true" size={21} />

        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#e2445c] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        id="notifications-panel"
        aria-labelledby="notifications-title"
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closePanel();
          }
        }}
        className="fixed inset-y-0 left-auto right-0 m-0 ml-auto h-dvh max-h-none w-full max-w-md border-0 bg-surface p-0 text-foreground shadow-2xl backdrop:bg-brand-navy/35"
      >
        <div className="flex h-20 items-center justify-between gap-3 border-b border-border/60 px-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Bell aria-hidden="true" size={21} />
            </span>

            <div className="min-w-0">
              <h2 id="notifications-title" className="text-lg font-semibold">
                Notificaciones
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
              aria-label="Cerrar notificaciones"
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

        <div className="h-[calc(100dvh-5rem)] overflow-y-auto">
          {unavailable ? (
            <PanelState
              icon={CircleAlert}
              title="No pudimos cargar las notificaciones"
              description="Intenta cerrar y volver a abrir este panel."
            />
          ) : notifications.length === 0 ? (
            <PanelState
              icon={CheckCheck}
              title="No tienes notificaciones"
              description="Las asignaciones, comentarios y cambios importantes aparecerán aquí."
            />
          ) : (
            <div>
              {groups.map((group) => {
                const isCollapsed = collapsedTaskIds.has(group.taskId);

                return (
                  <section
                    key={group.taskId}
                    className="border-b border-border/60 last:border-b-0"
                  >
                    <button
                      type="button"
                      aria-expanded={!isCollapsed}
                      onClick={() => toggleGroup(group.taskId)}
                      className="flex w-full cursor-pointer items-center gap-3 bg-surface-muted px-5 py-3 text-left transition hover:bg-surface-hover sm:px-6"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {group.taskTitle}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {group.workspaceName}
                        </span>
                      </span>

                      {group.unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold leading-none text-white">
                          {group.unreadCount}
                        </span>
                      )}

                      <ChevronDown
                        aria-hidden="true"
                        size={18}
                        className={`shrink-0 text-muted-foreground transition-transform ${
                          isCollapsed ? "-rotate-90" : ""
                        }`}
                      />
                    </button>

                    {!isCollapsed && (
                      <ol className="divide-y divide-border/60">
                        {group.items.map((notification) => {
                          const presentation = getNotificationPresentation(
                            notification.type,
                          );

                          const Icon = presentation.icon;
                          const isUnread = notification.readAt === null;

                          return (
                            <li
                              key={notification.id}
                              className={
                                isUnread ? "bg-[#f8fbff]" : "bg-surface"
                              }
                            >
                              <Link
                                href={`/tasks/${notification.task.id}`}
                                onClick={() => markAsRead(notification.id)}
                                className="group flex gap-3 px-5 py-4 transition hover:bg-surface-hover sm:px-6"
                              >
                                <span
                                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                                  style={{
                                    color: presentation.color,
                                    backgroundColor: presentation.softColor,
                                  }}
                                >
                                  <Icon aria-hidden="true" size={18} />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="flex items-start justify-between gap-3">
                                    <span className="line-clamp-2 text-sm font-semibold leading-5">
                                      {notification.title}
                                    </span>

                                    {isUnread && (
                                      <span
                                        aria-label="Sin leer"
                                        className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                                      />
                                    )}
                                  </span>

                                  <span className="mt-1 line-clamp-2 block text-sm leading-5 text-muted-foreground">
                                    {notification.body}
                                  </span>

                                  <span className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock3 aria-hidden="true" size={13} />
                                    {dateFormatter.format(
                                      new Date(notification.createdAt),
                                    )}
                                  </span>
                                </span>
                              </Link>
                            </li>
                          );
                        })}
                      </ol>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

function PanelState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-105 flex-col items-center justify-center px-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Icon aria-hidden="true" size={28} />
      </span>

      <h3 className="mt-5 text-base font-semibold">{title}</h3>

      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function getNotificationPresentation(type: TaskNotification["type"]): {
  icon: LucideIcon;
  color: string;
  softColor: string;
} {
  switch (type) {
    case "TASK_ASSIGNED":
      return {
        icon: UserRound,
        color: "#1769c2",
        softColor: "#eaf2ff",
      };

    case "TASK_STATUS_CHANGED":
      return {
        icon: Check,
        color: "#008a52",
        softColor: "#e5f9ef",
      };

    case "TASK_BLOCKED":
      return {
        icon: ShieldAlert,
        color: "#b4233f",
        softColor: "#ffedf1",
      };

    case "TASK_UPDATED":
      return {
        icon: Pencil,
        color: "#b26a00",
        softColor: "#fff4e0",
      };

    case "TASK_UNBLOCKED":
      return {
        icon: CheckCheck,
        color: "#008a52",
        softColor: "#e5f9ef",
      };

    case "TASK_COMMENTED":
      return {
        icon: MessageSquareText,
        color: "#7a42b8",
        softColor: "#f4ebff",
      };

    case "TASK_DUE_SOON":
      return {
        icon: Clock3,
        color: "#b26a00",
        softColor: "#fff4e0",
      };

    case "TASK_OVERDUE":
      return {
        icon: CircleAlert,
        color: "#b4233f",
        softColor: "#ffedf1",
      };

    default:
      return {
        icon: Flag,
        color: "#5f6470",
        softColor: "#f1f3f7",
      };
  }
}
