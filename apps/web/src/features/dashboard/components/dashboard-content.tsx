import Link from "next/link";
import { redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  Flag,
  LayoutDashboard,
  ListChecks,
  PencilLine,
  Plus,
  ShieldAlert,
  UserRound,
} from "lucide-react";

import LogoutButton from "@/features/auth/components/logout-button";
import type { DashboardSummary } from "@/features/dashboard/schemas/dashboard.schema";
import { getDashboardSummary } from "../dashboard.service";

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

const dueDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

const activityDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

const statusItems = [
  {
    key: "PENDING",
    label: "Pendientes",
    color: "#94a3b8",
    softColor: "#f1f5f9",
  },
  {
    key: "IN_PROGRESS",
    label: "En progreso",
    color: "#579dff",
    softColor: "#eaf2ff",
  },
  {
    key: "IN_REVIEW",
    label: "En revisión",
    color: "#a25ddc",
    softColor: "#f4ebff",
  },
  {
    key: "COMPLETED",
    label: "Completadas",
    color: "#00c875",
    softColor: "#e5f9ef",
  },
] as const;

const priorityItems = [
  {
    key: "LOW",
    label: "Baja",
    color: "#579dff",
  },
  {
    key: "NORMAL",
    label: "Normal",
    color: "#94a3b8",
  },
  {
    key: "HIGH",
    label: "Alta",
    color: "#fdab3d",
  },
  {
    key: "URGENT",
    label: "Urgente",
    color: "#e2445c",
  },
] as const;

export default async function DashboardPage() {
  const dashboardResult = await getDashboardSummary();

  if (dashboardResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (dashboardResult.status === "forbidden") {
    return (
      <Notice
        title="No tienes acceso activo"
        message="Contacta al administrador de la plataforma para recuperar tu acceso."
      />
    );
  }

  if (dashboardResult.status === "unavailable") {
    return (
      <Notice
        title="No pudimos cargar el dashboard"
        message="Intenta recargar la página en unos momentos."
      />
    );
  }

  const { viewer, metrics, tasksByStatus, tasksByPriority } =
    dashboardResult.result;

  return (
    <div className="mx-auto w-full  space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-[#d9e5f7] bg-linear-to-br from-[#f8fbff] via-surface to-[#eef5ff] px-6 py-7 shadow-(--shadow-panel) sm:px-8">
        <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full border-30 border-[#dcecff]/80" />
        <div className="absolute right-28 top-10 h-3 w-3 rounded-full bg-[#579dff]" />
        <div className="absolute right-20 top-28 h-2 w-2 rounded-full bg-[#a25ddc]" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-primary">
              <LayoutDashboard aria-hidden="true" size={16} />
              MYCAV ·{" "}
              {viewer.isAdmin
                ? "VISTA GLOBAL DE LA PLATAFORMA"
                : "RESUMEN DE TU TRABAJO"}
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Hola, {viewer.name}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {dateFormatter.format(new Date())}
            </p>
          </div>

          <div className="relative shrink-0">
            <LogoutButton />
          </div>
        </div>
      </section>

      <section aria-label="Métricas principales">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Espacios activos"
            value={metrics.activeWorkspaces}
            description="Disponibles para trabajar"
            icon={Building2}
            color="#579dff"
            softColor="#eaf2ff"
          />

          <MetricCard
            label="Tareas activas"
            value={metrics.activeTasks}
            description={`${metrics.totalTasks} tareas registradas`}
            icon={ClipboardList}
            color="#a25ddc"
            softColor="#f4ebff"
          />

          <MetricCard
            label="Tareas vencidas"
            value={metrics.overdueTasks}
            description={
              metrics.overdueTasks === 0
                ? "El equipo está al día"
                : "Requieren atención inmediata"
            }
            icon={AlertTriangle}
            color="#e2445c"
            softColor="#ffedf1"
          />

          <MetricCard
            label="Entregas esta semana"
            value={metrics.dueNextSevenDays}
            description="Durante los próximos 7 días"
            icon={CalendarClock}
            color="#fdab3d"
            softColor="#fff4dc"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <WorkStatusChart
          metrics={metrics}
          tasksByStatus={tasksByStatus}
          tasksByPriority={tasksByPriority}
        />

        <AttentionTasks tasks={dashboardResult.result.attentionTasks} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <UpcomingTasks tasks={dashboardResult.result.upcomingTasks} />

        <RecentActivity activity={dashboardResult.result.recentActivity} />
      </section>
    </div>
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
        style={{
          backgroundColor: softColor,
          color,
        }}
      >
        <Icon aria-hidden="true" size={20} />
      </span>

      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>

      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function WorkStatusChart({
  metrics,
  tasksByStatus,
  tasksByPriority,
}: {
  metrics: DashboardSummary["metrics"];
  tasksByStatus: DashboardSummary["tasksByStatus"];
  tasksByPriority: DashboardSummary["tasksByPriority"];
}) {
  const total = metrics.totalTasks;

  const statusData = statusItems.map((item) => ({
    ...item,
    value: tasksByStatus[item.key],
  }));

  let currentPercentage = 0;

  const donutSegments = statusData
    .filter((item) => item.value > 0)
    .map((item) => {
      const percentage = (item.value / total) * 100;
      const start = currentPercentage;
      currentPercentage += percentage;

      return `${item.color} ${start}% ${currentPercentage}%`;
    });

  const donutBackground =
    total === 0 || donutSegments.length === 0
      ? "#edf1f7"
      : `conic-gradient(${donutSegments.join(", ")})`;

  const priorityTotal = Object.values(tasksByPriority).reduce(
    (totalValue, value) => totalValue + value,
    0,
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
      <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold">Estado del trabajo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Distribución de tareas principales visibles.
          </p>
        </div>

        <span className="rounded-lg bg-[#e5f9ef] px-2.5 py-1 text-xs font-semibold text-[#008a52]">
          {metrics.completionRate}% completado
        </span>
      </header>

      <div className="grid gap-7 p-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center">
        <div className="mx-auto flex flex-col items-center">
          <div
            role="img"
            aria-label={`${metrics.completionRate}% de las tareas está completado`}
            className="relative flex h-44 w-44 items-center justify-center rounded-full shadow-inner"
            style={{ background: donutBackground }}
          >
            <div className="flex h-29.5 w-29.5 flex-col items-center justify-center rounded-full bg-surface text-center">
              <span className="text-3xl font-semibold tabular-nums tracking-tight">
                {metrics.completionRate}%
              </span>

              <span className="mt-1 text-xs text-muted-foreground">
                completado
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {metrics.completedTasks}
            </span>{" "}
            de {total} tareas completadas
          </p>
        </div>

        <div className="min-w-0">
          <dl className="grid gap-3 sm:grid-cols-2">
            {statusData.map((item) => {
              const percentage =
                total === 0 ? 0 : Math.round((item.value / total) * 100);

              return (
                <div
                  key={item.key}
                  className="rounded-xl border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span
                        aria-hidden="true"
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </dt>

                    <dd className="text-sm font-semibold tabular-nums">
                      {item.value}
                    </dd>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        backgroundColor: item.color,
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </dl>

          <div className="mt-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold">Prioridades abiertas</h3>

              <span className="text-xs text-muted-foreground">
                {priorityTotal} tareas
              </span>
            </div>

            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-surface-muted">
              {priorityItems.map((item) => {
                const value = tasksByPriority[item.key];
                const width =
                  priorityTotal === 0 ? 0 : (value / priorityTotal) * 100;

                return (
                  <span
                    key={item.key}
                    title={`${item.label}: ${value}`}
                    className="h-full transition-[width]"
                    style={{
                      width: `${width}%`,
                      backgroundColor: item.color,
                    }}
                  />
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
              {priorityItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>

                  <span className="font-semibold tabular-nums">
                    {tasksByPriority[item.key]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function AttentionTasks({
  tasks,
}: {
  tasks: DashboardSummary["attentionTasks"];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
      <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold">Requiere atención</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vencimientos y prioridades que conviene revisar.
          </p>
        </div>

        <ShieldAlert
          aria-hidden="true"
          size={20}
          className="shrink-0 text-[#e2445c]"
        />
      </header>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Todo está bajo control"
          description="No hay tareas vencidas, urgentes o próximas a vencer."
        />
      ) : (
        <ol className="divide-y divide-border/60">
          {tasks.map((task) => {
            const overdue = new Date(task.dueAt) < new Date();
            const priority = getPriorityPresentation(task.priority);

            return (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="group block px-5 py-4 transition hover:bg-surface-hover sm:px-6"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        color: overdue ? "#e2445c" : priority.color,
                        backgroundColor: overdue
                          ? "#ffedf1"
                          : priority.softColor,
                      }}
                    >
                      {overdue ? (
                        <AlertTriangle aria-hidden="true" size={17} />
                      ) : (
                        <Flag aria-hidden="true" size={17} />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <p className="line-clamp-2 text-sm font-semibold leading-5">
                          {task.title}
                        </p>

                        <ArrowUpRight
                          aria-hidden="true"
                          size={16}
                          className="mt-0.5 shrink-0 text-muted-foreground transition group-hover:text-primary"
                        />
                      </div>

                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {task.workspace.area.name} · {task.workspace.name}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-md px-2 py-1 text-xs font-medium"
                          style={{
                            color: overdue ? "#b4233f" : priority.color,
                            backgroundColor: overdue
                              ? "#ffedf1"
                              : priority.softColor,
                          }}
                        >
                          {overdue ? "Vencida" : priority.label}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          Entrega:{" "}
                          {dueDateFormatter.format(new Date(task.dueAt))}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}

function UpcomingTasks({
  tasks,
}: {
  tasks: DashboardSummary["upcomingTasks"];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
      <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold">Próximas entregas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tareas con entrega durante los próximos 7 días.
          </p>
        </div>

        <CalendarClock
          aria-hidden="true"
          size={20}
          className="shrink-0 text-[#fdab3d]"
        />
      </header>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Sin entregas próximas"
          description="No hay tareas programadas para los próximos 7 días."
        />
      ) : (
        <ol className="divide-y divide-border/60">
          {tasks.map((task) => {
            const priority = getPriorityPresentation(task.priority);

            return (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="group flex items-center gap-4 px-5 py-4 transition hover:bg-surface-hover sm:px-6"
                >
                  <time
                    dateTime={task.dueAt}
                    className="flex min-w-16 flex-col rounded-xl bg-[#fff4dc] px-2 py-2 text-center text-[#a86400]"
                  >
                    <span className="text-xs font-semibold uppercase">
                      {new Intl.DateTimeFormat("es-MX", {
                        month: "short",
                        timeZone: "America/Mexico_City",
                      })
                        .format(new Date(task.dueAt))
                        .replace(".", "")}
                    </span>

                    <span className="text-xl font-semibold leading-6">
                      {new Intl.DateTimeFormat("es-MX", {
                        day: "numeric",
                        timeZone: "America/Mexico_City",
                      }).format(new Date(task.dueAt))}
                    </span>
                  </time>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {task.title}
                    </p>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {task.workspace.area.name} · {task.workspace.name}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="rounded-md px-2 py-1 text-xs font-medium"
                        style={{
                          color: priority.color,
                          backgroundColor: priority.softColor,
                        }}
                      >
                        {priority.label}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {dueDateFormatter.format(new Date(task.dueAt))}
                      </span>
                    </div>
                  </div>

                  <ArrowUpRight
                    aria-hidden="true"
                    size={16}
                    className="shrink-0 text-muted-foreground transition group-hover:text-primary"
                  />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}

function RecentActivity({
  activity,
}: {
  activity: DashboardSummary["recentActivity"];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
      <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold">Actividad reciente</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Últimos movimientos registrados en las tareas.
          </p>
        </div>

        <ListChecks
          aria-hidden="true"
          size={20}
          className="shrink-0 text-[#579dff]"
        />
      </header>

      {activity.length === 0 ? (
        <EmptyState
          icon={CircleDot}
          title="Aún no hay movimientos"
          description="Las actualizaciones de tareas aparecerán en este espacio."
        />
      ) : (
        <ol className="divide-y divide-border/60">
          {activity.map((item) => {
            const presentation = getActivityPresentation(item.action);
            const Icon = presentation.icon;

            return (
              <li key={item.id} className="px-5 py-4 sm:px-6">
                <div className="flex gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{
                      color: presentation.color,
                      backgroundColor: presentation.softColor,
                    }}
                  >
                    <Icon aria-hidden="true" size={16} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm leading-5">
                      <span className="font-semibold">{item.actorName}</span>{" "}
                      <span className="text-muted-foreground">
                        {presentation.label}
                      </span>
                    </p>

                    <Link
                      href={`/tasks/${item.task.id}`}
                      className="mt-1 block truncate text-sm font-medium text-primary hover:underline"
                    >
                      {item.task.title}
                    </Link>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.task.workspace.name} ·{" "}
                      {activityDateFormatter.format(new Date(item.createdAt))}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">
        <Icon aria-hidden="true" size={21} />
      </span>

      <h3 className="mt-4 text-sm font-semibold">{title}</h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function getPriorityPresentation(
  priority: DashboardSummary["attentionTasks"][number]["priority"],
) {
  switch (priority) {
    case "URGENT":
      return {
        label: "Urgente",
        color: "#b4233f",
        softColor: "#ffedf1",
      };

    case "HIGH":
      return {
        label: "Alta",
        color: "#a86400",
        softColor: "#fff4dc",
      };

    case "LOW":
      return {
        label: "Baja",
        color: "#1769c2",
        softColor: "#eaf2ff",
      };

    default:
      return {
        label: "Normal",
        color: "#5f6470",
        softColor: "#f1f3f7",
      };
  }
}

function getActivityPresentation(
  action: DashboardSummary["recentActivity"][number]["action"],
): {
  label: string;
  color: string;
  softColor: string;
  icon: LucideIcon;
} {
  switch (action) {
    case "CREATED":
      return {
        label: "creó la tarea",
        color: "#1769c2",
        softColor: "#eaf2ff",
        icon: Plus,
      };

    case "STATUS_CHANGED":
      return {
        label: "actualizó el estado de",
        color: "#008a52",
        softColor: "#e5f9ef",
        icon: CheckCircle2,
      };

    case "BLOCKED":
      return {
        label: "bloqueó",
        color: "#b4233f",
        softColor: "#ffedf1",
        icon: ShieldAlert,
      };

    case "UNBLOCKED":
      return {
        label: "desbloqueó",
        color: "#008a52",
        softColor: "#e5f9ef",
        icon: CheckCircle2,
      };

    case "BLOCK_REASON_CHANGED":
      return {
        label: "actualizó el motivo de bloqueo de",
        color: "#a86400",
        softColor: "#fff4dc",
        icon: AlertTriangle,
      };

    default:
      return {
        label: "editó",
        color: "#7a42b8",
        softColor: "#f4ebff",
        icon: PencilLine,
      };
  }
}

function Notice({ title, message }: { title: string; message: string }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-8 shadow-(--shadow-panel)">
      <h1 className="text-xl font-semibold">{title}</h1>

      <p role="alert" className="mt-2 text-muted-foreground">
        {message}
      </p>
    </section>
  );
}
