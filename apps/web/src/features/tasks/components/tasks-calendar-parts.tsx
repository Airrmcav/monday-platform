"use client";

import Link from "next/link";
import { CalendarDays, Clock3, Flag, ShieldAlert } from "lucide-react";

import type {
  TaskParticipant,
  TaskPriority,
  TaskStatus,
} from "../schemas/tasks.schema";

export type CalendarTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string;
  isBlocked: boolean;
  participants: TaskParticipant[];
  parentId: string | null;
  parent: {
    id: string;
    title: string;
  } | null;
  workspace: {
    id: string;
    name: string;
    area: {
      id: string;
      name: string;
    };
  };
};

export const statusMeta: Record<
  TaskStatus,
  { label: string; color: string; softColor: string }
> = {
  PENDING: {
    label: "Pendiente",
    color: "bg-pending",
    softColor: "bg-pending-soft text-pending",
  },
  IN_PROGRESS: {
    label: "En progreso",
    color: "bg-progress",
    softColor: "bg-progress-soft text-progress",
  },
  IN_REVIEW: {
    label: "En revisión",
    color: "bg-review",
    softColor: "bg-review-soft text-review",
  },
  COMPLETED: {
    label: "Completada",
    color: "bg-success",
    softColor: "bg-success-soft text-success",
  },
};

export const priorityLabel: Record<TaskPriority, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const selectedDateFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const taskDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function ParticipantAvatarStack({
  participants,
  compact = false,
}: {
  participants: TaskParticipant[];
  compact?: boolean;
}) {
  if (participants.length === 0) {
    return null;
  }

  const visibleParticipants = participants.slice(0, compact ? 2 : 5);
  const hiddenParticipants = participants.slice(visibleParticipants.length);
  const participantLabel = participants
    .map(
      ({ role, user }) =>
        `${user.name}, ${role === "RESPONSIBLE" ? "responsable" : "colaborador"}`,
    )
    .join("; ");

  return (
    <span
      role="group"
      aria-label={`Participantes: ${participantLabel}`}
      className="inline-flex shrink-0 items-center"
    >
      {visibleParticipants.map(({ role, user }, index) => {
        const initials =
          user.name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => Array.from(part)[0])
            .join("")
            .toLocaleUpperCase("es-MX") || "?";

        return (
          <span
            key={user.id}
            role="img"
            aria-label={`${user.name}, ${role === "RESPONSIBLE" ? "responsable" : "colaborador"}`}
            title={`${user.name} · ${role === "RESPONSIBLE" ? "Responsable" : "Colaborador"}`}
            className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 font-semibold ${
              compact ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[10px]"
            } ${
              role === "RESPONSIBLE"
                ? "border-primary bg-primary-soft text-primary"
                : "border-review bg-review-soft text-review"
            } ${index > 0 ? "-ml-1.5" : ""}`}
          >
            {initials}
            {user.avatarUrl && (
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url("${user.avatarUrl}")` }}
              />
            )}
          </span>
        );
      })}
      {hiddenParticipants.length > 0 && (
        <span
          title={hiddenParticipants.map(({ user }) => user.name).join(", ")}
          className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 border-surface bg-surface-muted font-medium text-muted-foreground ${
            compact
              ? "-ml-1.5 h-5 min-w-5 px-1 text-[8px]"
              : "-ml-1.5 h-7 min-w-7 px-1.5 text-[10px]"
          }`}
        >
          +{hiddenParticipants.length}
        </span>
      )}
    </span>
  );
}

export type CalendarView = "month" | "week";

type CalendarGridProps = {
  days: Date[];
  month: Date;
  selectedDate: string;
  todayKey: string;
  view: CalendarView;
  tasksByDate: Map<string, CalendarTask[]>;
  onSelectDate: (dateKey: string) => void;
};

export function CalendarGrid({
  days,
  month,
  selectedDate,
  todayKey,
  view,
  tasksByDate,
  onSelectDate,
}: CalendarGridProps) {
  const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  return (
          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-175">
              <div className="grid grid-cols-7 border-b border-border/60 bg-surface-muted/40">
                {weekdays.map((day) => (
                  <div
                    key={day}
                    className="px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:px-3"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const dayKey = toDateKey(day);
                  const dayTasks = tasksByDate.get(dayKey) ?? [];
                  const isCurrentMonth =
                    day.getUTCMonth() === month.getUTCMonth();
                  const isSelected = dayKey === selectedDate;
                  const isToday = dayKey === todayKey;

                  return (
                    <button
                      key={dayKey}
                      type="button"
                      onClick={() => onSelectDate(dayKey)}
                      aria-label={`${selectedDateFormatter.format(day)}: ${dayTasks.length} tareas`}
                      aria-pressed={isSelected}
                      className={`${
                        view === "week"
                          ? "min-h-56 sm:min-h-64"
                          : "min-h-28 sm:min-h-32"
                      } border-b border-r border-border/50 p-1.5 text-left transition-colors sm:p-2 ${
                        isSelected
                          ? "bg-primary-soft/60"
                          : "hover:bg-surface-hover/70"
                      } ${isCurrentMonth ? "" : "bg-background/50"}`}
                    >
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                          isToday
                            ? "bg-primary font-bold text-primary-foreground"
                            : isSelected
                              ? "font-bold text-primary"
                              : isCurrentMonth
                                ? "font-medium text-foreground"
                                : "text-muted-foreground/60"
                        }`}
                      >
                        {day.getUTCDate()}
                      </span>

                      <span className="mt-1 flex flex-col gap-1">
                        {dayTasks
                          .slice(0, view === "week" ? 8 : 3)
                          .map((task) => (
                            <span
                              key={task.id}
                              title={`${task.title} · ${statusMeta[task.status].label}`}
                              className={`flex items-center gap-1 rounded px-1.5 py-1 text-[10px] font-medium leading-tight sm:text-[11px] ${
                                task.priority === "URGENT" &&
                                task.status !== "COMPLETED"
                                  ? "bg-danger-soft text-danger"
                                  : statusMeta[task.status].softColor
                              }`}
                            >
                              <span className="min-w-0 flex-1 truncate">
                                {task.parentId ? "↳ " : ""}
                                {task.title}
                              </span>
                              <ParticipantAvatarStack
                                participants={task.participants}
                                compact
                              />
                            </span>
                          ))}
                        {dayTasks.length > (view === "week" ? 8 : 3) && (
                          <span className="px-1 text-[10px] font-semibold text-primary">
                            +{dayTasks.length - (view === "week" ? 8 : 3)} más
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
  );
}

export function SelectedDayAgenda({
  selectedDate,
  selectedTasks,
}: {
  selectedDate: string;
  selectedTasks: CalendarTask[];
}) {
  return (
          <aside className="border-t border-border/60 bg-surface-muted/20 xl:border-l xl:border-t-0">
            <div className="border-b border-border/60 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                Agenda del día
              </p>
              <h3 className="mt-1 text-sm font-semibold capitalize">
                {selectedDateFormatter.format(
                  new Date(`${selectedDate}T00:00:00.000Z`),
                )}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedTasks.length}{" "}
                {selectedTasks.length === 1
                  ? "tarea programada"
                  : "tareas programadas"}
              </p>
            </div>

            {selectedTasks.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-10 text-center">
                <CalendarDays
                  aria-hidden="true"
                  size={24}
                  className="text-muted-foreground/60"
                />
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  No hay tareas con entrega en este día.
                </p>
              </div>
            ) : (
              <ul className="max-h-155 divide-y divide-border/50 overflow-y-auto">
                {selectedTasks.map((task) => (
                  <li key={task.id} className="p-3.5">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${statusMeta[task.status].color}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Área · {task.workspace.area.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                            Espacio · {task.workspace.name}
                          </p>
                          <p className="mt-1.5 wrap-break-words text-sm font-semibold leading-5 text-foreground transition-colors hover:text-primary">
                            {task.title}
                          </p>
                          {task.parent && (
                            <p className="mt-0.5 truncate text-[10px] font-medium text-primary">
                              Subtarea de: {task.parent.title}
                            </p>
                          )}
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${statusMeta[task.status].softColor}`}
                            >
                              {statusMeta[task.status].label}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Flag aria-hidden="true" size={11} />
                              {priorityLabel[task.priority]}
                            </span>
                            {task.isBlocked && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-danger">
                                <ShieldAlert aria-hidden="true" size={11} />
                                Bloqueada
                              </span>
                            )}
                          </div>
                          <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Clock3 aria-hidden="true" size={11} />
                            Entrega{" "}
                            {taskDateFormatter.format(new Date(task.dueAt))}
                          </p>
                          {task.participants.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground">
                                Participantes
                              </span>
                              <ParticipantAvatarStack
                                participants={task.participants}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
  );
}
