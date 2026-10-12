import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  UserRound,
} from "lucide-react";

import UserAvatar from "@/features/users/components/user-avatar";
import type { UserProfile } from "@/features/users/schemas/users.schemas";
import { getUserProfile } from "@/features/users/services/users.service";
import { getCurrentProfile } from "@/features/auth/services/auth.service";

type UserProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function UserProfilePage({
  params,
}: UserProfilePageProps) {
  const { id } = await params;
  const [result, viewerResult] = await Promise.all([
    getUserProfile(id),
    getCurrentProfile(),
  ]);

  if (
    result.status === "unauthenticated" ||
    viewerResult.status === "unauthenticated"
  ) {
    redirect("/login");
  }

  if (result.status === "forbidden" || viewerResult.status === "forbidden") {
    redirect("/dashboard");
  }

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "unavailable") {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-8 shadow-(--shadow-panel)">
        <h1 className="text-xl font-semibold">No pudimos cargar el perfil</h1>
        <p role="alert" className="mt-2 text-sm text-muted-foreground">
          Intenta recargar la página en unos momentos.
        </p>
      </section>
    );
  }

  const { profile } = result;
  const isAdmin =
    viewerResult.status === "authenticated" && viewerResult.user.isAdmin;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft aria-hidden="true" size={17} />
          Volver
        </Link>
        <p className="mt-6 text-sm font-medium text-primary">Personas</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Perfil de usuario
        </h1>
      </header>

      <section
        aria-label={`Perfil de ${profile.name}`}
        className="overflow-hidden rounded-2xl border border-border bg-surface shadow-(--shadow-panel)"
      >
        <div className="h-2 bg-primary" />
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
          <UserAvatar
            name={profile.name}
            avatarUrl={profile.avatarUrl}
            taskSummary={profile.taskSummary}
            className="h-28 w-28 border-4 border-primary-soft bg-primary-soft text-2xl font-semibold text-primary"
          />

          <div className="min-w-0 text-center sm:text-left">
            <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:justify-start">
              <UserRound aria-hidden="true" size={15} />
              Usuario
            </div>
            <h2 className="mt-2 wrap-break-words text-2xl font-semibold">
              {profile.name}
            </h2>
            <a
              href={`mailto:${profile.email}`}
              className="mt-3 inline-flex max-w-full items-center justify-center gap-2 break-all text-sm text-muted-foreground transition-colors hover:text-primary focus-visible:rounded focus-visible:outline-2 focus-visible:outline-ring sm:justify-start"
            >
              <Mail aria-hidden="true" size={16} className="shrink-0" />
              {profile.email}
            </a>
          </div>
        </div>

        <div className="border-t border-border/60 px-6 py-4 text-xs text-muted-foreground sm:px-8">
          Información de solo lectura
        </div>
      </section>

      <section
        aria-label={`Resumen de ${profile.name}`}
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"
      >
        <ProfileMetric
          label="Tareas asignadas"
          value={profile.profileSummary.totalTasks}
          icon={Activity}
          color="#579dff"
        />
        <ProfileMetric
          label="Abiertas"
          value={profile.profileSummary.activeTasks}
          icon={Clock3}
          color="#fdab3d"
        />
        <ProfileMetric
          label="Completadas"
          value={profile.profileSummary.completedTasks}
          icon={CheckCircle2}
          color="#00c875"
        />
        <ProfileMetric
          label="Vencidas"
          value={profile.profileSummary.overdueTasks}
          icon={AlertTriangle}
          color="#e2445c"
        />
        <ProfileMetric
          label="Espacios"
          value={profile.profileSummary.workspaceCount}
          icon={Building2}
          color="#a25ddc"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <TaskStatusChart profile={profile} />
        <UserWorkspaces profile={profile} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <UserRecentTasks profile={profile} isAdmin={isAdmin} />
        <UserRecentActivity profile={profile} isAdmin={isAdmin} />
      </section>
      {viewerResult.status === "unavailable" && (
        <p role="status" className="text-xs text-muted-foreground">
          No se pudieron verificar tus permisos. Las tareas y actividades se
          muestran sin enlaces.
        </p>
      )}
    </div>
  );
}

function ProfileMetric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-border/70 bg-surface p-4 shadow-(--shadow-panel)">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: color }}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <Icon aria-hidden="true" size={17} style={{ color }} />
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </article>
  );
}

const taskStatuses = [
  { key: "PENDING", label: "Pendientes", color: "#94a3b8" },
  { key: "IN_PROGRESS", label: "En progreso", color: "#579dff" },
  { key: "IN_REVIEW", label: "En revisión", color: "#a25ddc" },
  { key: "COMPLETED", label: "Completadas", color: "#00c875" },
] as const;

const taskStatusLabels: Record<
  UserProfile["recentTasks"][number]["status"],
  string
> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  COMPLETED: "Completada",
};

const taskPriorityLabels: Record<
  UserProfile["recentTasks"][number]["priority"],
  string
> = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const profileDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

function TaskStatusChart({ profile }: { profile: UserProfile }) {
  const { tasksByStatus } = profile.taskSummary;
  const total = profile.profileSummary.totalTasks;

  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
      <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold">Estado de sus tareas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Distribución de tareas asignadas a {profile.name}.
          </p>
        </div>
        <span className="rounded-lg bg-success-soft px-2.5 py-1 text-xs font-semibold text-success">
          {profile.profileSummary.completionRate}% completado
        </span>
      </header>

      <div className="p-5 sm:p-6">
        <div
          role="img"
          aria-label={taskStatuses
            .map(({ key, label }) => `${label}: ${tasksByStatus[key]}`)
            .join(", ")}
          className="flex h-4 overflow-hidden rounded-full bg-surface-muted"
        >
          {taskStatuses.map(({ key, label, color }) => {
            const count = tasksByStatus[key];
            const width = total === 0 ? 0 : (count / total) * 100;

            return (
              <span
                key={key}
                title={`${label}: ${count}`}
                className="h-full transition-[width]"
                style={{ width: `${width}%`, backgroundColor: color }}
              />
            );
          })}
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {taskStatuses.map(({ key, label, color }) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3"
            >
              <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                {label}
              </dt>
              <dd className="text-sm font-semibold tabular-nums">
                {tasksByStatus[key]}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 flex items-center justify-between border-t border-border/60 pt-4 text-sm">
          <span className="text-muted-foreground">Tareas vencidas</span>
          <span className="font-semibold tabular-nums text-danger">
            {profile.profileSummary.overdueTasks}
          </span>
        </p>
      </div>
    </article>
  );
}

function UserWorkspaces({ profile }: { profile: UserProfile }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
      <header className="border-b border-border/60 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold">Espacios de trabajo</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Espacios activos a los que pertenece.
        </p>
      </header>

      {profile.workspaces.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground sm:p-6">
          No pertenece a espacios activos.
        </p>
      ) : (
        <ul className="max-h-96 divide-y divide-border/60 overflow-y-auto">
          {profile.workspaces.map((workspace) => (
            <li
              key={workspace.id}
              className="flex items-center gap-3 px-5 py-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Building2 aria-hidden="true" size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{workspace.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {workspace.areaName}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {workspace.taskCount}{" "}
                {workspace.taskCount === 1 ? "tarea" : "tareas"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function UserRecentTasks({
  profile,
  isAdmin,
}: {
  profile: UserProfile;
  isAdmin: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
      <header className="border-b border-border/60 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold">Tareas abiertas</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vencimientos y tareas que requieren atención.
        </p>
      </header>

      {profile.recentTasks.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground sm:p-6">
          No tiene tareas abiertas.
        </p>
      ) : (
        <ul className="max-h-112 divide-y divide-border/60 overflow-y-auto">
          {profile.recentTasks.map((task) => {
            const content = (
              <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{task.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {task.workspace.name}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-primary-soft px-2 py-1 text-[10px] font-medium text-primary">
                      {taskStatusLabels[task.status]}
                    </span>
                    <span className="rounded-md bg-surface-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                      {taskPriorityLabels[task.priority]}
                    </span>
                    {task.isOverdue && (
                      <span className="rounded-md bg-danger-soft px-2 py-1 text-[10px] font-medium text-danger">
                        Vencida
                      </span>
                    )}
                  </div>
                </div>
                <time
                  dateTime={task.dueAt}
                  className={`shrink-0 text-xs ${task.isOverdue ? "font-medium text-danger" : "text-muted-foreground"}`}
                >
                  {profileDateFormatter.format(new Date(task.dueAt))}
                </time>
              </div>
            );

            return (
              <li key={task.id}>
                {isAdmin ? (
                  <Link
                    href={`/tasks/${task.id}`}
                    className="block transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

const activityLabels: Record<
  UserProfile["recentActivity"][number]["action"],
  string
> = {
  CREATED: "Creó la tarea",
  UPDATED: "Actualizó la tarea",
  STATUS_CHANGED: "Cambió el estado de",
  BLOCKED: "Bloqueó la tarea",
  UNBLOCKED: "Desbloqueó la tarea",
  BLOCK_REASON_CHANGED: "Actualizó el motivo de bloqueo de",
};

function UserRecentActivity({
  profile,
  isAdmin,
}: {
  profile: UserProfile;
  isAdmin: boolean;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
      <header className="border-b border-border/60 px-5 py-4 sm:px-6">
        <h2 className="text-base font-semibold">Actividad reciente</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Últimos movimientos registrados por {profile.name}.
        </p>
      </header>

      {profile.recentActivity.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground sm:p-6">
          No hay actividad reciente registrada.
        </p>
      ) : (
        <ol className="max-h-112 divide-y divide-border/60 overflow-y-auto">
          {profile.recentActivity.map((item) => (
            <li key={item.id} className="flex gap-3 px-5 py-4 sm:px-6">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Activity aria-hidden="true" size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">
                  {activityLabels[item.action]}
                </p>
                {isAdmin ? (
                  <Link
                    href={`/tasks/${item.task.id}`}
                    className="mt-1 block truncate text-sm font-medium text-primary hover:underline"
                  >
                    {item.task.title}
                  </Link>
                ) : (
                  <p className="mt-1 truncate text-sm font-medium">
                    {item.task.title}
                  </p>
                )}
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {item.task.workspace.name} ·{" "}
                  {profileDateFormatter.format(new Date(item.createdAt))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
