import type { DashboardSummary } from "@/features/dashboard/schemas/dashboard.schema";
import UserAvatar, {
  USER_TASK_HEALTH_THRESHOLDS,
} from "@/features/users/components/user-avatar";
import { Users } from "lucide-react";

const userTaskStatusItems = [
  { key: "PENDING", label: "Pendientes", color: "#94a3b8" },
  { key: "IN_PROGRESS", label: "En progreso", color: "#579dff" },
  { key: "IN_REVIEW", label: "En revisión", color: "#a25ddc" },
  { key: "COMPLETED", label: "Completadas", color: "#00c875" },
] as const;

export default function TeamUserStatus({
  users,
}: {
  users: DashboardSummary["teamUsers"];
}) {
  return (
    <section
      aria-label="Estado de tareas de los usuarios"
      className="mt-3 w-[1550px] rounded-xl border border-border/60 bg-surface/75 p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold">
          <Users aria-hidden="true" size={15} className="text-primary" />
          Estado del equipo
        </h2>

        <span className="text-[10px] text-muted-foreground">
          {users.length} {users.length === 1 ? "usuario" : "usuarios"}
        </span>
      </div>

      <ul
        aria-label="Leyenda del contorno de estado de usuarios"
        className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-4 text-muted-foreground"
      >
        <li className="inline-flex items-center gap-1">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--color-success)" }}
          />
          <span style={{ color: "var(--color-success)" }}>Verde: al día</span>
        </li>
        <li className="inline-flex items-center gap-1">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--color-progress)" }}
          />
          <span style={{ color: "var(--color-progress)" }}>
            Amarillo: {USER_TASK_HEALTH_THRESHOLDS.open} o más tareas abiertas o
            1–2 vencidas
          </span>
        </li>
        <li className="inline-flex items-center gap-1">
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: "var(--color-danger)" }}
          />
          <span style={{ color: "var(--color-danger)" }}>
            Rojo: {USER_TASK_HEALTH_THRESHOLDS.overdue} o más vencidas
          </span>
        </li>
      </ul>

      {users.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          No hay usuarios registrados.
        </p>
      ) : (
        <div className="mt-3 max-h-80 overflow-auto rounded-lg border border-border/60">
          <table className="w-full min-w-175 border-collapse text-left">
            <caption className="sr-only">
              Tareas por estado, porcentaje completado y tareas vencidas para
              cada usuario
            </caption>
            <thead className="sticky top-0 z-10 bg-surface">
              <tr className="border-b border-border/60">
                <th
                  scope="col"
                  className="sticky left-0 z-20 min-w-44 bg-surface px-3 py-2 text-[10px] font-semibold text-muted-foreground"
                >
                  Usuario
                </th>
                {userTaskStatusItems.map((item) => (
                  <th
                    key={item.key}
                    scope="col"
                    className="px-2 py-2 text-center text-[10px] font-semibold"
                    style={{ color: item.color }}
                  >
                    {item.label}
                  </th>
                ))}
                <th
                  scope="col"
                  className="min-w-24 px-2 py-2 text-center text-[10px] font-semibold text-[#00a95a]"
                >
                  % completadas
                </th>
                <th
                  scope="col"
                  className="min-w-32 px-3 py-2 text-right text-[10px] font-semibold text-danger"
                >
                  Vencidas
                </th>
              </tr>
            </thead>
            <tbody>
              {[...users]
                .sort(
                  (a, b) =>
                    b.taskSummary.overdueTaskCount -
                      a.taskSummary.overdueTaskCount ||
                    b.taskSummary.openTaskCount - a.taskSummary.openTaskCount ||
                    a.name.localeCompare(b.name, "es"),
                )
                .map((user) => (
                  <UserTaskStatusRow key={user.id} user={user} />
                ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function UserTaskStatusRow({
  user,
}: {
  user: DashboardSummary["teamUsers"][number];
}) {
  const tasksByStatus = user.taskSummary.tasksByStatus;
  const { openTaskCount, overdueTaskCount } = user.taskSummary;
  const totalTaskCount = tasksByStatus
    ? Object.values(tasksByStatus).reduce((total, count) => total + count, 0)
    : null;
  const completedPercentage =
    totalTaskCount === null || totalTaskCount === 0
      ? null
      : Math.round(((tasksByStatus?.COMPLETED ?? 0) / totalTaskCount) * 100);

  return (
    <tr className="border-b border-border/40 last:border-b-0 hover:bg-surface-muted/40">
      <th
        scope="row"
        className="sticky left-0 z-[1] bg-surface px-3 py-2 text-left"
      >
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar
            userId={user.id}
            name={user.name}
            avatarUrl={user.avatarUrl}
            taskSummary={user.taskSummary}
            className="h-8 w-8 shrink-0 bg-primary-soft text-[10px] font-semibold text-primary"
          />
          <span
            title={`${user.name}${user.status === "INACTIVE" ? " · Inactivo" : ""}`}
            className={`truncate text-[11px] font-medium ${
              user.status === "INACTIVE"
                ? "text-muted-foreground"
                : "text-foreground"
            }`}
          >
            {user.name}
          </span>
        </div>
      </th>
      {userTaskStatusItems.map((item) => {
        const count = tasksByStatus?.[item.key];

        return (
          <td key={item.key} className="px-2 py-2 text-center">
            <span
              aria-label={`${item.label}: ${count ?? "no disponible"}`}
              className="inline-flex min-w-8 justify-center rounded-md px-2 py-1 text-[11px] font-semibold tabular-nums"
              style={{
                color: item.color,
                backgroundColor: `${item.color}1A`,
              }}
            >
              {count ?? "–"}
            </span>
          </td>
        );
      })}
      <td className="px-2 py-2 text-center">
        <span
          aria-label={
            completedPercentage === null
              ? "Porcentaje completado no disponible"
              : `${completedPercentage}% de tareas completadas`
          }
          className="inline-flex min-w-12 justify-center rounded-md bg-[#e5f9ef] px-2 py-1 text-[11px] font-semibold tabular-nums text-[#008f4c]"
        >
          {completedPercentage === null ? "–" : `${completedPercentage}%`}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        <span
          className={`font-semibold tabular-nums ${
            overdueTaskCount > 0 ? "text-danger" : "text-muted-foreground"
          }`}
        >
          {overdueTaskCount}
        </span>
        <span className="ml-1 whitespace-nowrap text-[10px] text-muted-foreground">
          de {openTaskCount} abiertas
        </span>
      </td>
    </tr>
  );
}
