import { getCurrentProfile } from "@/features/auth/services/auth.service";
import TaskBlockForm from "@/features/tasks/components/task-block-form";
import TaskComments from "@/features/tasks/components/task-comments";
import TaskHistory from "@/features/tasks/components/task-history";
import TaskPriorityBadge from "@/features/tasks/components/task-priority-badge";
import TaskStatusForm from "@/features/tasks/components/task-status-form";
import TaskSubtasks from "@/features/tasks/components/task-subtasks";
import UserAvatar from "@/features/users/components/user-avatar";
import {
  getSubtask,
  getTask,
  getTaskComments,
  getTaskHistory,
} from "@/features/tasks/tasks.service";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FilePenLine,
  Flag,
  FolderOpen,
  ShieldAlert,
  Users,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

type TaskPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    historyPage?: string | string[];
    historyPageSize?: string | string[];
    commentsPage?: string | string[];
    commentsPageSize?: string | string[];
  }>;
};

const statusLabels = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  COMPLETED: "Completada",
};

const statusClasses = {
  PENDING: "bg-pending-soft text-pending",
  IN_PROGRESS: "bg-progress-soft text-progress",
  IN_REVIEW: "bg-review-soft text-review",
  COMPLETED: "bg-success-soft text-success",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Sin definir";
}

function parsePositiveInteger(
  value: string | string[] | undefined,
  defaultValue: number,
): number | null {
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    return null;
  }

  const number = Number(value);

  return Number.isSafeInteger(number) ? number : null;
}

export default async function TaskPage({
  params,
  searchParams,
}: TaskPageProps) {
  const { id } = await params;
  const result = await getTask(id);

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "not-found" || result.status === "forbidden") {
    notFound();
  }

  if (result.status === "unavailable") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8">
        <WifiOff
          aria-hidden="true"
          size={32}
          className="text-muted-foreground"
        />

        <h1 className="mt-4 text-xl font-semibold">
          No pudimos cargar la tarea
        </h1>

        <p role="alert" className="mt-2 text-muted-foreground">
          Intenta recargar la página en unos momentos.
        </p>

        <Link
          href="/areas"
          className="mt-6 inline-block rounded font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          Volver a áreas
        </Link>
      </section>
    );
  }
  const profile = await getCurrentProfile();
  if (profile.status === "unauthenticated") {
    redirect("/login");
  }

  if (profile.status === "forbidden") {
    notFound();
  }
  if (profile.status === "unavailable") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-8">
        <h1 className="text-xl font-semibold">
          No pudimos verificar tu acceso
        </h1>

        <p role="alert" className="mt-2 text-muted-foreground">
          Intenta recargar la página en unos momentos.
        </p>
      </section>
    );
  }

  const { task } = result;
  const subtasksResult =
    task.parentId === null ? await getSubtask(task.id) : null;

  if (subtasksResult?.status === "unauthenticated") {
    redirect("/login");
  }

  if (
    subtasksResult?.status === "not-found" ||
    subtasksResult?.status === "forbidden"
  ) {
    notFound();
  }

  const query = await searchParams;

  const historyPage = parsePositiveInteger(query.historyPage, 1);
  const historyPageSize = parsePositiveInteger(query.historyPageSize, 20);

  const commentsPage = parsePositiveInteger(query.commentsPage, 1);
  const commentsPageSize = parsePositiveInteger(query.commentsPageSize, 20);
  if (
    historyPage === null ||
    historyPageSize === null ||
    commentsPage === null ||
    commentsPageSize === null ||
    historyPage > 1_000_000 ||
    historyPageSize > 50 ||
    commentsPage > 1_000_000 ||
    commentsPageSize > 50
  ) {
    redirect(`/tasks/${task.id}`);
  }

  const historyResult = await getTaskHistory(task.id, {
    page: historyPage,
    pageSize: historyPageSize,
  });

  if (historyResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (
    historyResult.status === "not-found" ||
    historyResult.status === "forbidden"
  ) {
    notFound();
  }

  if (historyResult.status === "success") {
    const lastPage = Math.max(1, historyResult.result.pagination.totalPages);

    if (historyPage > lastPage) {
      redirect(
        `/tasks/${task.id}?historyPage=${lastPage}&historyPageSize=${historyPageSize}#task-history`,
      );
    }
  }

  const commentsResult = await getTaskComments(task.id, {
    page: commentsPage,
    pageSize: commentsPageSize,
  });

  if (commentsResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (
    commentsResult.status === "not-found" ||
    commentsResult.status === "forbidden"
  ) {
    notFound();
  }

  if (commentsResult.status === "success") {
    const lastPage = Math.max(1, commentsResult.result.pagination.totalPages);

    if (commentsPage > lastPage) {
      redirect(
        `/tasks/${task.id}?historyPage=${historyPage}&historyPageSize=${historyPageSize}&commentsPage=${lastPage}&commentsPageSize=${commentsPageSize}#task-comments`,
      );
    }
  }

  const canEditTask =
    task.status !== "COMPLETED" &&
    (profile.user.isAdmin ||
      task.participants.some(
        (participant) =>
          participant.userId === profile.user.id &&
          participant.role === "RESPONSIBLE",
      ));
  const responsibleUsers = task.participants.filter(
    (participant) => participant.role === "RESPONSIBLE",
  );

  const collaborators = task.participants.filter(
    (participant) => participant.role === "COLLABORATOR",
  );

  const hoursRemaining =
    (Date.parse(task.dueAt) - Date.now()) / (1000 * 60 * 60);

  const deliveryAppearance =
    task.status === "COMPLETED"
      ? {
          label: "Fecha de entrega",
          className: "bg-background text-foreground",
        }
      : hoursRemaining < 0
        ? {
            label: "Entrega vencida",
            className: "bg-danger-soft text-danger",
          }
        : hoursRemaining <= 24
          ? {
              label: "Próxima a vencer",
              className: "bg-danger-soft text-danger",
            }
          : hoursRemaining <= 72
            ? {
                label: "Entrega cercana",
                className: "bg-progress-soft text-progress",
              }
            : {
                label: "Fecha de entrega",
                className: "bg-primary-soft text-primary",
              };

  const participantGroups = [
    {
      title: "Responsables",
      participants: responsibleUsers,
      avatarClassName: "bg-primary-soft text-primary",
      emptyMessage: "Sin responsables asignados.",
    },
    {
      title: "Colaboradores",
      participants: collaborators,
      avatarClassName: "bg-review-soft text-review",
      emptyMessage: "Sin colaboradores asignados.",
    },
  ];
  return (
    <div className="min-w-0 space-y-6">
      <Link
        href={
          task.parent
            ? `/tasks/${task.parent.id}`
            : `/workspaces/${task.workspace.id}`
        }
        className="inline-flex max-w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={17} className="shrink-0" />

        <span className="min-w-0 wrap-break-words">
          {task.parent
            ? `Volver a ${task.parent.title}`
            : `Volver a ${task.workspace.name}`}
        </span>
      </Link>

      <header className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm">
        <div className="relative overflow-hidden p-6 sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary-soft/70 via-surface to-surface"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-30 border-primary/5"
          />

          <div className="relative">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white bg-surface text-primary shadow-sm">
                  <ClipboardList aria-hidden="true" size={25} />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {task.parentId === null
                      ? "Detalle de la tarea"
                      : "Detalle de la subtarea"}
                  </p>

                  <h1 className="mt-2 wrap-break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                    {task.title}
                  </h1>
                </div>
              </div>

              {canEditTask && (
                <Link
                  href={`/tasks/${task.id}/edit`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-primary/20 bg-surface px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <FilePenLine aria-hidden="true" size={17} />
                  Editar tarea
                </Link>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="wrap-break-words">
                {task.workspace.area.name}
              </span>

              <span aria-hidden="true">/</span>

              <Link
                href={`/workspaces/${task.workspace.id}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <FolderOpen
                  aria-hidden="true"
                  size={15}
                  className="shrink-0"
                />
                <span className="min-w-0 wrap-break-words">
                  {task.workspace.name}
                </span>
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${statusClasses[task.status]}`}
              >
                {statusLabels[task.status]}
              </span>

              <TaskPriorityBadge priority={task.priority} />

              {task.isBlocked && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-danger-soft px-3 py-1.5 text-xs font-semibold text-danger">
                  <ShieldAlert aria-hidden="true" size={14} />
                  Bloqueada
                </span>
              )}

              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${deliveryAppearance.className}`}
              >
                <CalendarDays aria-hidden="true" size={14} />
                {deliveryAppearance.label}: {formatDate(task.dueAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 p-6 sm:p-8">
          <h2 className="text-sm font-semibold">Descripción</h2>

          <p className="mt-3 max-w-4xl whitespace-pre-wrap wrap-break-words text-sm leading-7 text-muted-foreground">
            {task.description?.trim() ||
              "Esta tarea todavía no tiene una descripción."}
          </p>

          {task.isBlocked && (
            <div className="mt-6 max-w-4xl rounded-xl border border-danger/20 bg-danger-soft p-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-danger">
                <ShieldAlert aria-hidden="true" size={17} />
                Motivo del bloqueo
              </h2>

              <p className="mt-2 whitespace-pre-wrap wrap-break-words text-sm leading-6 text-foreground">
                {task.blockedReason || "No se registró un motivo."}
              </p>
            </div>
          )}
        </div>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {subtasksResult?.status === "success" && (
            <TaskSubtasks
              taskId={task.id}
              tasks={subtasksResult.result.data}
              canCreate={task.status !== "COMPLETED"}
            />
          )}

          {subtasksResult?.status === "unavailable" && (
            <section className="rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6">
              <h2 className="text-base font-semibold">Subtareas</h2>

              <p
                role="alert"
                className="mt-3 text-sm leading-6 text-muted-foreground"
              >
                No pudimos cargar las subtareas. Intenta recargar la página en
                unos momentos.
              </p>
            </section>
          )}

          {commentsResult.status === "success" ? (
            <TaskComments
              key={`comments:${task.id}:${commentsPage}:${commentsPageSize}`}
              taskId={task.id}
              currentUserId={profile.user.id}
              result={commentsResult.result}
              page={commentsPage}
            />
          ) : (
            <section
              id="task-comments"
              aria-labelledby="task-comments-error-title"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6"
            >
              <h2
                id="task-comments-error-title"
                className="text-base font-semibold"
              >
                Comentarios y avances
              </h2>

              <p
                role="alert"
                className="mt-3 text-sm leading-6 text-muted-foreground"
              >
                No pudimos cargar los comentarios. Intenta recargar la página en
                unos momentos.
              </p>
            </section>
          )}

          {historyResult.status === "success" ? (
            <TaskHistory
              key={`${task.id}:${historyPage}:${historyPageSize}`}
              taskId={task.id}
              result={historyResult.result}
            />
          ) : (
            <section
              id="task-history"
              aria-labelledby="task-history-error-title"
              className="scroll-mt-24 rounded-2xl border border-border/70 bg-surface p-5 shadow-sm sm:p-6"
            >
              <h2
                id="task-history-error-title"
                className="text-base font-semibold"
              >
                Historial de la tarea
              </h2>

              <p
                role="alert"
                className="mt-3 text-sm leading-6 text-muted-foreground"
              >
                No pudimos cargar el historial. Intenta recargar la página en
                unos momentos.
              </p>
            </section>
          )}
        </div>

        {/* Equipo y acciones */}
        <aside
          aria-label="Equipo y acciones de la tarea"
          className="min-w-0 space-y-5"
        >
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
            <div className="border-b border-border/60 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays
                  aria-hidden="true"
                  size={18}
                  className="text-primary"
                />
                Fechas de la tarea
              </h2>
            </div>

            <div className="p-5">
              <dl className="space-y-3">
                <div className="rounded-xl bg-background/60 p-3">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Fecha de inicio
                  </dt>

                  <dd className="mt-1.5 text-sm font-semibold leading-6">
                    {task.startsAt ? (
                      <time dateTime={task.startsAt}>
                        {formatDate(task.startsAt)}
                      </time>
                    ) : (
                      "Sin definir"
                    )}
                  </dd>
                </div>

                <div
                  className={`rounded-xl p-3 ${deliveryAppearance.className}`}
                >
                  <dt className="flex items-center gap-1.5 text-xs font-medium">
                    <Flag aria-hidden="true" size={15} />
                    {deliveryAppearance.label}
                  </dt>

                  <dd className="mt-1.5 text-sm font-semibold leading-6">
                    <time dateTime={task.dueAt}>{formatDate(task.dueAt)}</time>
                  </dd>
                </div>

                {task.completedAt && (
                  <div className="rounded-xl bg-success-soft p-3 text-success">
                    <dt className="text-xs font-medium">
                      Fecha de finalización
                    </dt>

                    <dd className="mt-1.5 text-sm font-semibold leading-6">
                      <time dateTime={task.completedAt}>
                        {formatDate(task.completedAt)}
                      </time>
                    </dd>
                  </div>
                )}
              </dl>

              <p className="mt-4 text-xs text-muted-foreground">
                Horarios de Ciudad de México.
              </p>
            </div>
          </section>
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Users aria-hidden="true" size={18} className="text-primary" />
                Equipo de la tarea
              </h2>

              <span className="rounded-md bg-background px-2 py-1 text-xs text-muted-foreground">
                {task.participants.length}
              </span>
            </div>

            <div className="space-y-5 p-5">
              {participantGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    {group.title}
                    <span className="font-normal">
                      ({group.participants.length})
                    </span>
                  </h3>

                  {group.participants.length > 0 ? (
                    <ul className="space-y-2">
                      {group.participants.map(({ user }) => (
                        <li
                          key={user.id}
                          className="flex items-center gap-3 rounded-xl bg-background/60 px-3 py-2.5"
                        >
                          <UserAvatar
                            userId={user.id}
                            name={user.name}
                            avatarUrl={user.avatarUrl ?? null}
                            className={`h-8 w-8 text-xs font-semibold ${group.avatarClassName}`}
                          />

                          <span className="min-w-0 wrap-break-words text-sm font-medium">
                            {user.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs leading-5 text-muted-foreground">
                      {group.emptyMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <TaskStatusForm
            taskId={task.id}
            currentStatus={task.status}
            isAdmin={profile.user.isAdmin}
          />

          <TaskBlockForm
            taskId={task.id}
            status={task.status}
            isBlocked={task.isBlocked}
            blockedReason={task.blockedReason}
          />
        </aside>
      </div>
    </div>
  );
}
