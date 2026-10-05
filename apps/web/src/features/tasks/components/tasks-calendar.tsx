"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Circle,
  Clock3,
  Flag,
  ShieldAlert,
} from "lucide-react";

import type { TaskPriority, TaskStatus } from "../schemas/tasks.schema";

export type CalendarTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string;
  isBlocked: boolean;
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

type TasksCalendarProps = {
  tasks: CalendarTask[];
  initialToday: string;
};

const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const statusMeta: Record<
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

const priorityLabel: Record<TaskPriority, string> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const monthFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const weekRangeFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

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

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function taskDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getCalendarDays(month: Date) {
  const firstOfMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1),
  );
  const mondayOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const dayCount = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const cellCount = Math.ceil((mondayOffset + dayCount) / 7) * 7;
  const start = new Date(firstOfMonth);
  start.setUTCDate(start.getUTCDate() - mondayOffset);

  return Array.from({ length: cellCount }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return day;
  });
}

function getCalendarWeek(dateKey: string) {
  const selected = new Date(`${dateKey}T00:00:00.000Z`);
  const mondayOffset = (selected.getUTCDay() + 6) % 7;
  const monday = new Date(selected);
  monday.setUTCDate(selected.getUTCDate() - mondayOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + index);
    return day;
  });
}

function shiftMonth(value: Date, amount: number) {
  const targetMonth = new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + amount, 1),
  );
  const lastDayOfMonth = new Date(
    Date.UTC(
      targetMonth.getUTCFullYear(),
      targetMonth.getUTCMonth() + 1,
      0,
    ),
  ).getUTCDate();

  targetMonth.setUTCDate(Math.min(value.getUTCDate(), lastDayOfMonth));
  return targetMonth;
}

function shiftWeek(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + amount * 7);
  return toDateKey(date);
}

export default function TasksCalendar({
  tasks,
  initialToday,
}: TasksCalendarProps) {
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState(initialToday);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [areaFilter, setAreaFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">(
    "ALL",
  );
  const month = useMemo(
    () => new Date(`${selectedDate.slice(0, 7)}-01T00:00:00.000Z`),
    [selectedDate],
  );
  const days = useMemo(
    () =>
      view === "month" ? getCalendarDays(month) : getCalendarWeek(selectedDate),
    [month, selectedDate, view],
  );
  const monthKey = toDateKey(month).slice(0, 7);
  const todayKey = initialToday;

  const areas = useMemo(
    () => {
      const uniqueAreas = new Map(
        tasks.map((task) => [
          task.workspace.area.id,
          task.workspace.area.name,
        ]),
      );

      return [...uniqueAreas].sort((left, right) =>
        left[1].localeCompare(right[1], "es"),
      );
    },
    [tasks],
  );

  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (statusFilter === "ALL" || task.status === statusFilter) &&
          (areaFilter === "ALL" || task.workspace.area.id === areaFilter) &&
          (priorityFilter === "ALL" || task.priority === priorityFilter),
      ),
    [areaFilter, priorityFilter, statusFilter, tasks],
  );

  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, CalendarTask[]>();

    for (const task of filteredTasks) {
      const key = taskDateKey(task.dueAt);
      const items = grouped.get(key) ?? [];
      items.push(task);
      grouped.set(key, items);
    }

    for (const items of grouped.values()) {
      items.sort(
        (left, right) =>
          Date.parse(left.dueAt) - Date.parse(right.dueAt) ||
          left.title.localeCompare(right.title, "es"),
      );
    }

    return grouped;
  }, [filteredTasks]);

  const selectedTasks = tasksByDate.get(selectedDate) ?? [];
  const monthlyTasks = filteredTasks.filter(
    (task) => taskDateKey(task.dueAt).slice(0, 7) === monthKey,
  );
  const monthlyOverdue = monthlyTasks.filter(
    (task) => task.status !== "COMPLETED" && taskDateKey(task.dueAt) < todayKey,
  ).length;
  const monthlyCompleted = monthlyTasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const weekStart = days[0];
  const weekEnd = days[days.length - 1];
  const periodLabel =
    view === "month"
      ? monthFormatter.format(month)
      : `${weekRangeFormatter.format(weekStart)} – ${weekRangeFormatter.format(weekEnd)}, ${weekEnd.getUTCFullYear()}`;

  function navigatePeriod(direction: -1 | 1) {
    if (view === "week") {
      setSelectedDate(shiftWeek(selectedDate, direction));
      return;
    }

    setSelectedDate(
      toDateKey(shiftMonth(new Date(`${selectedDate}T00:00:00.000Z`), direction)),
    );
  }

  function goToToday() {
    setSelectedDate(initialToday);
  }

  return (
    <div className="mx-auto w-full space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-[#d9e5f7] bg-linear-to-br from-[#f8fbff] via-surface to-[#eef5ff] p-5 shadow-(--shadow-panel) sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-24 h-64 w-64 rounded-full border-30 border-[#dcecff]/80"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-primary">
              <CalendarDays aria-hidden="true" size={16} />
              PLANEACIÓN
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Calendario
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Consulta las fechas de entrega de las tareas disponibles en tus
              espacios de trabajo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg border border-border/70 bg-surface/80 px-3 py-2 text-muted-foreground">
              <strong className="mr-1.5 text-foreground">
                {monthlyTasks.length}
              </strong>
              tareas este mes
            </span>
            <span className="rounded-lg border border-border/70 bg-surface/80 px-3 py-2 text-muted-foreground">
              <strong className="mr-1.5 text-danger">{monthlyOverdue}</strong>
              vencidas
            </span>
            <span className="rounded-lg border border-border/70 bg-surface/80 px-3 py-2 text-muted-foreground">
              <strong className="mr-1.5 text-success">{monthlyCompleted}</strong>
              completadas
            </span>
          </div>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
        <div className="flex flex-col gap-4 border-b border-border/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigatePeriod(-1)}
                aria-label={view === "month" ? "Mes anterior" : "Semana anterior"}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <ArrowLeft aria-hidden="true" size={17} />
              </button>
              <button
                type="button"
                onClick={() => navigatePeriod(1)}
                aria-label={view === "month" ? "Mes siguiente" : "Semana siguiente"}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <ArrowRight aria-hidden="true" size={17} />
              </button>
              <h2 className="ml-1 min-w-36 text-lg font-semibold capitalize">
                {periodLabel}
              </h2>
              <button
                type="button"
                onClick={goToToday}
                className="ml-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-ring"
              >
                Hoy
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                role="group"
                aria-label="Vista del calendario"
                className="inline-flex rounded-lg border border-border bg-surface p-0.5"
              >
                <button
                  type="button"
                  onClick={() => setView("month")}
                  aria-pressed={view === "month"}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                    view === "month"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mes
                </button>
                <button
                  type="button"
                  onClick={() => setView("week")}
                  aria-pressed={view === "week"}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
                    view === "week"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Semana
                </button>
              </div>
              <label>
                <span className="sr-only">Filtrar por área</span>
                <select
                  value={areaFilter}
                  onChange={(event) => setAreaFilter(event.target.value)}
                  className="h-9 max-w-44 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="ALL">Todas las áreas</option>
                  {areas.map(([areaId, areaName]) => (
                    <option key={areaId} value={areaId}>
                      {areaName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Filtrar por estado</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as TaskStatus | "ALL")
                  }
                  className="h-9 max-w-44 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="ALL">Todos los estados</option>
                  {Object.entries(statusMeta).map(([status, meta]) => (
                    <option key={status} value={status}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Filtrar por prioridad</span>
                <select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(
                      event.target.value as TaskPriority | "ALL",
                    )
                  }
                  className="h-9 max-w-44 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="ALL">Todas las prioridades</option>
                  {Object.entries(priorityLabel).map(([priority, label]) => (
                    <option key={priority} value={priority}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
            {Object.entries(statusMeta).map(([status, meta]) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${meta.color}`} />
                {meta.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <ShieldAlert aria-hidden="true" size={13} className="text-danger" />
              Prioridad urgente
            </span>
          </div>
        </div>

        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 overflow-x-auto">
            <div className="min-w-[700px]">
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
                      onClick={() => setSelectedDate(dayKey)}
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
                        {dayTasks.slice(0, view === "week" ? 8 : 3).map((task) => (
                          <span
                            key={task.id}
                            title={`${task.title} · ${statusMeta[task.status].label}`}
                            className={`block truncate rounded px-1.5 py-1 text-[10px] font-medium leading-tight sm:text-[11px] ${
                              task.priority === "URGENT" &&
                              task.status !== "COMPLETED"
                                ? "bg-danger-soft text-danger"
                                : statusMeta[task.status].softColor
                            }`}
                          >
                            {task.parentId ? "↳ " : ""}
                            {task.title}
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
                {selectedTasks.length === 1 ? "tarea programada" : "tareas programadas"}
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
              <ul className="max-h-[620px] divide-y divide-border/50 overflow-y-auto">
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
                            Entrega {taskDateFormatter.format(new Date(task.dueAt))}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </section>

      {tasks.length === 0 && (
        <p className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-muted-foreground">
          <Circle aria-hidden="true" size={15} />
          No hay tareas disponibles para mostrar en el calendario.
        </p>
      )}
    </div>
  );
}
