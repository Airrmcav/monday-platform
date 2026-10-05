"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Flag,
  ListTodo,
  TrendingUp,
} from "lucide-react";

import type { MyWorkSummary } from "@/features/dashboard/schemas/dashboard.schema";

const priorityMeta = {
  LOW: { label: "Baja", color: "#579dff" },
  NORMAL: { label: "Normal", color: "#94a3b8" },
  HIGH: { label: "Alta", color: "#fdab3d" },
  URGENT: { label: "Urgente", color: "#e2445c" },
} as const;

const statusMeta = {
  PENDING: { label: "Pendiente" },
  IN_PROGRESS: { label: "En progreso" },
  IN_REVIEW: { label: "En revisión" },
  COMPLETED: { label: "Completada" },
} as const;

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: "America/Mexico_City",
});

function getCurrentTimestamp() {
  return Date.now();
}

type Props = {
  data: MyWorkSummary;
  focus: "all" | "overdue" | "upcoming";
};

export default function MyWorkPage({ data, focus }: Props) {
  const { viewer, metrics, priorityBreakdown, areaSummary, tasks } = data;

  const [priorityFilter, setPriorityFilter] = useState<
    "ALL" | keyof typeof priorityMeta
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | keyof typeof statusMeta
  >("ALL");
  const [areaFilter, setAreaFilter] = useState("ALL");
  const now = getCurrentTimestamp();

  const areaOptions = useMemo(
    () => [...new Set(tasks.map((task) => task.workspace.area.name))],
    [tasks],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesArea =
        areaFilter === "ALL" || task.workspace.area.name === areaFilter;

      return matchesPriority && matchesStatus && matchesArea;
    });
  }, [areaFilter, priorityFilter, statusFilter, tasks]);

  const totalPriorityTasks = Object.values(priorityBreakdown).reduce(
    (sum, item) => sum + item,
    0,
  );

  return (
    <div className="mx-auto w-full space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-[#d9e5f7] bg-linear-to-br from-[#f8fbff] via-surface to-[#eef5ff] px-6 py-7 shadow-(--shadow-panel) sm:px-8">
        <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full border-30 border-[#dcecff]/80" />
        <div className="absolute right-28 top-10 h-3 w-3 rounded-full bg-[#579dff]" />
        <div className="absolute right-20 top-28 h-2 w-2 rounded-full bg-[#a25ddc]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-primary">
              <ListTodo aria-hidden="true" size={16} />
              MI TRABAJO
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              {viewer.name}
            </h1>

            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              {focus === "overdue"
                ? "Tareas asignadas que ya vencieron y requieren atención."
                : focus === "upcoming"
                  ? "Tareas asignadas con fecha de entrega en los próximos 7 días."
                  : "Tareas en las que participas, prioridad de entrega y foco por área."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-primary">
              {metrics.totalAssigned} asignadas
            </span>
            <span className="rounded-full border border-border/70 bg-white/70 px-2.5 py-1">
              {metrics.dueThisWeek} por vencer
            </span>
            <span className="rounded-full border border-border/70 bg-white/70 px-2.5 py-1">
              {metrics.completionRate}% completado
            </span>
          </div>
        </div>
      </section>

      <section aria-label="Métricas de Mi trabajo">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            label="Asignadas"
            value={metrics.totalAssigned}
            description="En total"
            icon={ClipboardList}
            color="#579dff"
            softColor="#eaf2ff"
          />
          <MetricCard
            label="En progreso"
            value={metrics.inProgressTasks}
            description="Actualmente activas"
            icon={TrendingUp}
            color="#a25ddc"
            softColor="#f4ebff"
          />
          <MetricCard
            label="Completadas"
            value={metrics.completedTasks}
            description={`${metrics.completionRate}% de avance`}
            icon={CheckCircle2}
            color="#00c875"
            softColor="#e5f9ef"
          />
          <MetricCard
            label="Vencidas"
            value={metrics.overdueTasks}
            description="Requieren atención"
            icon={AlertTriangle}
            color="#e2445c"
            softColor="#ffedf1"
          />
          <MetricCard
            label="En 7 días"
            value={metrics.dueThisWeek}
            description="Próximas entregas"
            icon={Flag}
            color="#fdab3d"
            softColor="#fff4dc"
          />
          <MetricCard
            label="Urgentes"
            value={metrics.urgentTasks}
            description="Prioridad alta"
            icon={ArrowUpRight}
            color="#e2445c"
            softColor="#fff1f2"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
          <header className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-base font-semibold">Prioridad del trabajo</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Distribución de tus tareas abiertas.
              </p>
            </div>
            <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
              {totalPriorityTasks} abiertas
            </span>
          </header>

          <div className="space-y-6 p-5 sm:p-6">
            {Object.entries(priorityMeta).map(([key, meta]) => {
              const value = priorityBreakdown[key as keyof typeof priorityBreakdown];
              const percentage =
                totalPriorityTasks === 0 ? 0 : (value / totalPriorityTasks) * 100;

              return (
                <div key={key}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: meta.color }}
                      />
                      {meta.label}
                    </span>
                    <span className="font-semibold tabular-nums">{value}</span>
                  </div>

                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: meta.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
          <header className="border-b border-border/60 px-5 py-4 sm:px-6">
            <h2 className="text-base font-semibold">Áreas de trabajo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tareas por área y vencimientos.
            </p>
          </header>

          {areaSummary.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground sm:p-6">
              No tienes tareas asignadas en áreas activas.
            </div>
          ) : (
            <div className="space-y-3 p-5 sm:p-6">
              {areaSummary.map((area) => (
                <div
                  key={area.areaId}
                  className="rounded-xl border border-border/60 bg-surface-muted/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Building2 aria-hidden="true" size={16} className="text-primary" />
                      <span className="font-medium">{area.areaName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {area.taskCount} tareas
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Vencidas</span>
                    <span className="font-semibold text-foreground">{area.overdue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
        <header className="flex flex-col gap-4 border-b border-border/60 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Tareas asignadas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {focus === "overdue"
                ? `Mostrando ${tasks.length} de ${metrics.overdueTasks} tareas vencidas.`
                : focus === "upcoming"
                  ? `Mostrando ${tasks.length} de ${metrics.dueThisWeek} tareas por vencer.`
                  : "Ordenadas por prioridad y vencimiento."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <FilterButton
              active={priorityFilter === "ALL"}
              onClick={() => setPriorityFilter("ALL")}
            >
              Todas
            </FilterButton>
            {Object.entries(priorityMeta).map(([key, meta]) => (
              <FilterButton
                key={key}
                active={priorityFilter === key}
                onClick={() => setPriorityFilter(key as keyof typeof priorityMeta)}
                style={{ borderColor: `${meta.color}55`, color: meta.color }}
              >
                {meta.label}
              </FilterButton>
            ))}

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | keyof typeof statusMeta)
              }
              className="rounded-md border border-border/70 bg-surface px-2.5 py-2 text-xs font-medium text-foreground outline-none ring-0"
              aria-label="Filtrar tareas por estado"
            >
              <option value="ALL">Todos los estados</option>
              {Object.entries(statusMeta).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>

            <select
              value={areaFilter}
              onChange={(event) => setAreaFilter(event.target.value)}
              className="rounded-md border border-border/70 bg-surface px-2.5 py-2 text-xs font-medium text-foreground outline-none ring-0"
              aria-label="Filtrar tareas por área"
            >
              <option value="ALL">Todas las áreas</option>
              {areaOptions.map((areaName) => (
                <option key={areaName} value={areaName}>
                  {areaName}
                </option>
              ))}
            </select>
          </div>
        </header>

        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <ListTodo aria-hidden="true" size={24} />
            </span>
            <p className="mt-4 text-sm font-medium text-foreground">
              No hay tareas que coincidan con los filtros actuales.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Prueba con otros criterios para encontrar tu trabajo.
            </p>
          </div>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="hidden grid-cols-[minmax(260px,1.8fr)_minmax(150px,1fr)_130px_110px_150px_32px] items-center gap-3 border-b border-border/60 bg-surface-muted/40 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground xl:grid"
            >
              <span>Tarea</span>
              <span>Área / espacio</span>
              <span>Estado</span>
              <span>Prioridad</span>
              <span>Fecha de entrega</span>
              <span />
            </div>

            <ul className="divide-y divide-border/60">
              {filteredTasks.map((task) => {
                const priority = priorityMeta[task.priority];
                const isOverdue =
                  task.status !== "COMPLETED" &&
                  Date.parse(task.dueAt) < now;
                const statusClass = {
                  PENDING: "bg-pending-soft text-pending",
                  IN_PROGRESS: "bg-progress-soft text-progress",
                  IN_REVIEW: "bg-review-soft text-review",
                  COMPLETED: "bg-success-soft text-success",
                }[task.status];

                return (
                  <li
                    key={task.id}
                    className="group px-4 py-4 transition-colors hover:bg-primary-soft/20 sm:px-5"
                  >
                    <div className="grid items-center gap-3 xl:grid-cols-[minmax(260px,1.8fr)_minmax(150px,1fr)_130px_110px_150px_32px]">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="hidden h-9 w-1 shrink-0 rounded-full bg-primary/30 transition-colors group-hover:bg-primary sm:block"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/tasks/${task.id}`}
                            className="block truncate rounded-sm text-sm font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            {task.title}
                          </Link>
                          <p className="mt-1 truncate text-xs text-muted-foreground xl:hidden">
                            {task.workspace.area.name} · {task.workspace.name}
                          </p>
                        </div>
                      </div>

                      <div className="hidden min-w-0 xl:block">
                        <p className="truncate text-xs font-medium text-foreground">
                          {task.workspace.name}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {task.workspace.area.name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            task.status === "COMPLETED"
                              ? "bg-success"
                              : task.status === "IN_PROGRESS"
                                ? "bg-progress"
                                : task.status === "IN_REVIEW"
                                  ? "bg-review"
                                  : "bg-pending"
                          }`}
                        />
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${statusClass}`}
                        >
                          {statusMeta[task.status].label}
                        </span>
                      </div>

                      <span
                        className="inline-flex w-fit items-center rounded-md px-2.5 py-1.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: `${priority.color}20`,
                          color: priority.color,
                        }}
                      >
                        {priority.label}
                      </span>

                      <div
                        className={`flex items-center gap-2 text-xs ${
                          isOverdue ? "font-semibold text-danger" : "text-foreground"
                        }`}
                      >
                        <CalendarDays
                          aria-hidden="true"
                          size={15}
                          className={
                            isOverdue ? "shrink-0" : "shrink-0 text-muted-foreground"
                          }
                        />
                        <time dateTime={task.dueAt}>
                          {dateFormatter.format(new Date(task.dueAt))}
                        </time>
                      </div>

                      <Link
                        href={`/tasks/${task.id}`}
                        aria-label={`Abrir tarea: ${task.title}`}
                        className="hidden h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring xl:flex"
                      >
                        <ArrowUpRight aria-hidden="true" size={16} />
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
  style,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border/70 bg-surface text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
      style={style}
    >
      {children}
    </button>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  color,
  softColor,
}: {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  color: string;
  softColor: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-border/70 bg-surface p-5 shadow-(--shadow-panel)">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: color }}
      />

      <span
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: softColor, color }}
      >
        <Icon aria-hidden="true" size={20} />
      </span>

      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </article>
  );
}
