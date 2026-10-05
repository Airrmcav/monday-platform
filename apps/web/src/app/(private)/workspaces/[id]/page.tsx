import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FolderOpen,
  FolderPen,
  Plus,
  ShieldAlert,
  WifiOff,
} from "lucide-react";

import { getWorkspace } from "@/features/workspaces/services/workspaces.service";
import { getTasks } from "@/features/tasks/tasks.service";
import TasksTable from "@/features/tasks/components/task-table";
import { getCurrentProfile } from "@/features/auth/services/auth.service";

type WorkspacePageProps = {
  params: Promise<{ id: string }>;
};

const creationDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params;
  const result = await getWorkspace(id);

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
          No pudimos cargar el espacio
        </h1>

        <p role="alert" className="mt-2 text-muted-foreground">
          Intenta recargar la página en unos momentos.
        </p>

        <Link
          href="/areas"
          className="mt-6 inline-block rounded text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-ring"
        >
          Volver a áreas
        </Link>
      </section>
    );
  }

  const { workspace } = result;

  const profile = await getCurrentProfile();

  if (profile.status === "unauthenticated") {
    redirect("/login");
  }

  if (profile.status === "forbidden") {
    notFound();
  }

  if (profile.status === "unavailable") {
    return (
      <section className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-xl font-semibold">
          No pudimos verificar tu acceso
        </h1>

        <p role="alert" className="mt-3 text-sm text-muted-foreground">
          Intenta recargar la página en unos momentos.
        </p>
      </section>
    );
  }

  const tasksResult = await getTasks(workspace.id);
  console.info("[WorkspacePage] Tareas:", {
    status: tasksResult.status,
    total:
      tasksResult.status === "success"
        ? tasksResult.result.data.length
        : undefined,
  });

  if (tasksResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (
    tasksResult.status === "not-found" ||
    tasksResult.status === "forbidden"
  ) {
    notFound();
  }

  const now = Date.now();

  const summary =
    tasksResult.status === "success"
      ? [
          {
            label: "Tareas visibles",
            value: tasksResult.result.data.length,
            icon: ClipboardList,
            color: "bg-primary-soft text-primary",
          },
          {
            label: "Completadas",
            value: tasksResult.result.data.filter(
              (task) => task.status === "COMPLETED",
            ).length,
            icon: CheckCircle2,
            color: "bg-success-soft text-success",
          },
          {
            label: "Vencidas",
            value: tasksResult.result.data.filter(
              (task) =>
                task.status !== "COMPLETED" && Date.parse(task.dueAt) < now,
            ).length,
            icon: Clock3,
            color: "bg-danger-soft text-danger",
          },
          {
            label: "Bloqueadas",
            value: tasksResult.result.data.filter(
              (task) => task.status !== "COMPLETED" && task.isBlocked,
            ).length,
            icon: ShieldAlert,
            color: "bg-progress-soft text-progress",
          },
        ]
      : null;

  return (
    <div className="min-w-0 space-y-6">
      <Link
        href={`/areas/${workspace.areaId}`}
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Volver a {workspace.area.name}
      </Link>

      <header className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm">
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
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white bg-surface text-primary shadow-sm">
                  <FolderOpen aria-hidden="true" size={28} />
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Espacio de trabajo
                  </p>

                  <h1 className="mt-2 wrap-break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                    {workspace.name}
                  </h1>

                  {workspace.description?.trim() && (
                    <p className="mt-3 max-w-2xl whitespace-pre-line wrap-break-words text-sm leading-6 text-muted-foreground">
                      {workspace.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto lg:shrink-0 lg:justify-end">
                {profile.user.isAdmin && (
                  <Link
                    href={`/workspaces/${workspace.id}/edit`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <FolderPen aria-hidden="true" size={18} />
                    Editar espacio
                  </Link>
                )}

                <Link
                  href={`/workspaces/${workspace.id}/tasks/new`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Plus aria-hidden="true" size={18} />
                  Nueva tarea
                </Link>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={`/areas/${workspace.areaId}`}
                className="inline-flex max-w-full items-center gap-2 rounded-lg border border-primary/10 bg-surface/80 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Building2 aria-hidden="true" size={15} className="shrink-0" />
                <span className="min-w-0 wrap-break-words">
                  {workspace.area.name}
                </span>
              </Link>

              <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <CalendarDays
                  aria-hidden="true"
                  size={15}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  Creado el{" "}
                  <time dateTime={workspace.createdAt}>
                    {creationDateFormatter.format(
                      new Date(workspace.createdAt),
                    )}
                  </time>
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border/60 px-6 sm:px-8">
          <div className="inline-flex items-center gap-2 border-b-2 border-primary py-4 text-sm font-semibold text-primary">
            <ClipboardList aria-hidden="true" size={17} />
            Tareas del espacio
            {tasksResult.status === "success" && (
              <span className="ml-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs">
                {tasksResult.result.data.length}
              </span>
            )}
          </div>
        </div>
      </header>

      {summary && (
        <section aria-label="Resumen de tus tareas visibles">
          <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            {summary.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-surface px-3 py-3"
                >
                  <dt className="flex min-w-0 flex-1 items-center gap-2.5">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}
                    >
                      <Icon aria-hidden="true" size={16} />
                    </span>

                    <span className="text-xs font-medium text-muted-foreground">
                      {item.label}
                    </span>
                  </dt>

                  <dd className="shrink-0 text-xl font-semibold tabular-nums">
                    {item.value}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}

      {tasksResult.status === "success" ? (
        <TasksTable tasks={tasksResult.result.data} />
      ) : (
        <section className="rounded-2xl border border-border bg-surface p-6">
          <WifiOff
            aria-hidden="true"
            size={24}
            className="text-muted-foreground"
          />

          <h2 className="mt-3 text-lg font-semibold">
            No pudimos cargar las tareas
          </h2>

          <p role="alert" className="mt-2 text-sm text-muted-foreground">
            Intenta recargar la página en unos momentos.
          </p>
        </section>
      )}
    </div>
  );
}
