import type { LucideIcon } from "lucide-react";

import type { DashboardSummary } from "@/features/dashboard/schemas/dashboard.schema";

const statusItems = [
  {
    key: "PENDING",
    label: "Pendientes",
    color: "#94a3b8",
  },
  {
    key: "IN_PROGRESS",
    label: "En progreso",
    color: "#579dff",
  },
  {
    key: "IN_REVIEW",
    label: "En revisión",
    color: "#a25ddc",
  },
  {
    key: "COMPLETED",
    label: "Completadas",
    color: "#00c875",
  },
] as const;

const priorityItems = [
  { key: "LOW", label: "Baja", color: "#579dff" },
  { key: "NORMAL", label: "Normal", color: "#94a3b8" },
  { key: "HIGH", label: "Alta", color: "#fdab3d" },
  { key: "URGENT", label: "Urgente", color: "#e2445c" },
] as const;

export function DashboardMetricCard({
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

export function WorkStatusChart({
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
            Distribución de tareas con entrega en el período seleccionado.
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
