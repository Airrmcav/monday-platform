"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Circle,
  ShieldAlert,
} from "lucide-react";

import type { TaskPriority, TaskStatus } from "../schemas/tasks.schema";
import {
  CalendarGrid,
  SelectedDayAgenda,
  priorityLabel,
  statusMeta,
  toDateKey,
  type CalendarTask,
} from "./tasks-calendar-parts";

export type { CalendarTask } from "./tasks-calendar-parts";

type TasksCalendarProps = {
  tasks: CalendarTask[];
  initialToday: string;
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
    Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0),
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

  const areas = useMemo(() => {
    const uniqueAreas = new Map(
      tasks.map((task) => [task.workspace.area.id, task.workspace.area.name]),
    );

    return [...uniqueAreas].sort((left, right) =>
      left[1].localeCompare(right[1], "es"),
    );
  }, [tasks]);

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
      toDateKey(
        shiftMonth(new Date(`${selectedDate}T00:00:00.000Z`), direction),
      ),
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
              <strong className="mr-1.5 text-success">
                {monthlyCompleted}
              </strong>
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
                aria-label={
                  view === "month" ? "Mes anterior" : "Semana anterior"
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                <ArrowLeft aria-hidden="true" size={17} />
              </button>
              <button
                type="button"
                onClick={() => navigatePeriod(1)}
                aria-label={
                  view === "month" ? "Mes siguiente" : "Semana siguiente"
                }
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
              <ShieldAlert
                aria-hidden="true"
                size={13}
                className="text-danger"
              />
              Prioridad urgente
            </span>
          </div>
        </div>

        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1fr)_300px]">
          <CalendarGrid
            days={days}
            month={month}
            selectedDate={selectedDate}
            todayKey={todayKey}
            view={view}
            tasksByDate={tasksByDate}
            onSelectDate={setSelectedDate}
          />
          <SelectedDayAgenda
            selectedDate={selectedDate}
            selectedTasks={selectedTasks}
          />
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
