import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CalendarDays,
  ClipboardList,
  FolderOpen,
  LayoutGrid,
  Plus,
  Clock3,
  ShieldAlert,
} from "lucide-react";

import { getAreas } from "@/features/areas/services/areas.service";
import { getWorkspaces } from "@/features/workspaces/services/workspaces.service";
import { workspaceSchema } from "@/features/workspaces/schemas/workspaces.schemas";
import { getCurrentProfile } from "@/features/auth/services/auth.service";
import UserAvatar from "@/features/users/components/user-avatar";

type AreaPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AreaPage({ params }: AreaPageProps) {
  const { id } = await params;

  if (!workspaceSchema.shape.areaId.safeParse(id).success) {
    notFound();
  }

  const areasResult = await getAreas();

  if (areasResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (areasResult.status === "forbidden") {
    redirect("/dashboard");
  }

  if (areasResult.status === "unavailable") {
    return <LoadError />;
  }

  const area = areasResult.result.data.find((item) => item.id === id);

  if (!area) {
    notFound();
  }

  const workspacesResult = await getWorkspaces(area.id);

  if (workspacesResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (
    workspacesResult.status === "forbidden" ||
    workspacesResult.status === "invalid"
  ) {
    notFound();
  }

  if (workspacesResult.status === "unavailable") {
    return <LoadError />;
  }

  const workspaces = workspacesResult.result.data;
  const profile = await getCurrentProfile();
  const canCreate = "user" in profile && profile.user.isAdmin;

  const workspaceColors = [
    {
      cover: "bg-[#e5f1ff]",
      icon: "bg-[#0073ea]",
      accent: "bg-[#0073ea]",
    },
    {
      cover: "bg-[#eee9ff]",
      icon: "bg-[#784bd1]",
      accent: "bg-[#784bd1]",
    },
    {
      cover: "bg-[#def5ef]",
      icon: "bg-[#00866a]",
      accent: "bg-[#00866a]",
    },
    {
      cover: "bg-[#fff0e5]",
      icon: "bg-[#b85b00]",
      accent: "bg-[#b85b00]",
    },
  ];

  function getWorkspaceColors(id: string) {
    const hash = Array.from(id).reduce(
      (value, character) => value + character.charCodeAt(0),
      0,
    );

    return workspaceColors[hash % workspaceColors.length];
  }

  const creationDateFormatter = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Mexico_City",
  });

  return (
    <div className="min-w-0 space-y-6">
      <Link
        href="/areas"
        className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <ArrowLeft aria-hidden="true" size={17} />
        Volver a áreas
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

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white bg-surface text-primary shadow-sm">
                <Building2 aria-hidden="true" size={28} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Área de trabajo
                </p>

                <h1 className="mt-2 wrap-break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                  {area.name}
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                  Los proyectos de tu equipo, en un mismo lugar. Abre un espacio
                  para continuar con sus tareas.
                </p>
              </div>
            </div>

            {canCreate && (
              <Link
                href={`/areas/${area.id}/workspaces/new`}
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:self-center"
              >
                <Plus aria-hidden="true" size={19} />
                Nuevo espacio
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-border/60 px-6 sm:px-8">
          <div className="inline-flex items-center gap-2 border-b-2 border-primary py-4 text-sm font-semibold text-primary">
            <LayoutGrid aria-hidden="true" size={17} />
            Espacios disponibles
            <span className="ml-1 rounded-md bg-primary-soft px-2 py-0.5 text-xs">
              {workspaces.length}
            </span>
          </div>
        </div>
      </header>

      <section aria-labelledby="workspaces-title">
        {workspaces.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <FolderOpen aria-hidden="true" size={30} />
            </div>

            <h3 className="mt-5 text-lg font-semibold">
              {canCreate
                ? "Dale espacio al próximo proyecto"
                : "Tus espacios aparecerán aquí"}
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {canCreate
                ? "Crea un espacio para organizar una obra o proyecto y asignar a su equipo."
                : "Cuando te asignen a un espacio de esta área, podrás consultar su contenido desde aquí."}
            </p>

            {canCreate && (
              <Link
                href={`/areas/${area.id}/workspaces/new`}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Plus aria-hidden="true" size={18} />
                Crear primer espacio
              </Link>
            )}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {workspaces.map((workspace) => {
              const colors = getWorkspaceColors(workspace.id);

              const progress =
                workspace.taskCount === 0
                  ? 0
                  : Math.floor(
                      (workspace.completedTaskCount / workspace.taskCount) *
                        100,
                    );

              return (
                <li key={workspace.id} className="min-w-0">
                  <article
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-surface transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-(--shadow-panel) motion-reduce:transition-none"
                  >
                    {/* Portada */}
                    <div
                      aria-hidden="true"
                      className={`relative h-28 shrink-0 overflow-hidden ${colors.cover}`}
                    >
                      <div className="absolute inset-0 bg-linear-to-br from-white/35 to-transparent" />

                      <div className="absolute -right-10 -top-20 h-52 w-52 rounded-full border-28 border-white/30" />

                      <div className="absolute -bottom-24 left-10 h-36 w-36 rounded-full border-20 border-white/25" />

                      <div className="absolute right-7 top-6 h-20 w-28 rotate-12 rounded-xl border border-white/70 bg-white/35" />

                      <div className="absolute right-11 top-4 h-20 w-28 -rotate-6 rounded-xl border border-white/90 bg-white/80 p-3 shadow-sm transition-transform duration-200 group-hover:rotate-0 motion-reduce:transition-none">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-4 w-4 rounded-md ${colors.accent}`}
                          />
                          <span className="h-1.5 w-12 rounded-full bg-foreground/10" />
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="h-1.5 w-full rounded-full bg-foreground/10" />
                          <div className="h-1.5 w-3/4 rounded-full bg-foreground/10" />
                        </div>
                      </div>
                    </div>

                    <div className="relative flex flex-1 flex-col px-5 pb-5">
                      {/* Identidad del espacio */}
                      <span
                        aria-hidden="true"
                        className={`-mt-6 flex h-12 w-12 items-center justify-center rounded-xl border-4 border-surface text-white shadow-sm ${colors.icon}`}
                      >
                        <FolderOpen size={23} />
                      </span>

                      <div className="pb-5 pt-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Espacio de trabajo
                        </p>

                        <h3 className="mt-1.5 wrap-break-words text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary">
                          <Link
                            href={`/workspaces/${workspace.id}`}
                            className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          >
                            {workspace.name}
                          </Link>
                        </h3>

                        <p className="mt-2 line-clamp-2 whitespace-pre-line wrap-break-words text-sm leading-6 text-muted-foreground">
                          {workspace.description?.trim() ||
                            "Este espacio todavía no tiene una descripción."}
                        </p>
                      </div>

                      {/* Avance */}
                      <div className="mt-auto min-h-16 border-t border-border/60 py-4 flex flex-col justify-center">
                        {workspace.taskCount > 0 ? (
                          <>
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {workspace.completedTaskCount}
                                </span>{" "}
                                de {workspace.taskCount}{" "}
                                {workspace.taskCount === 1
                                  ? "tarea completada"
                                  : "tareas completadas"}
                              </p>

                              <span
                                className={`text-xs font-semibold tabular-nums ${
                                  progress === 100
                                    ? "text-success"
                                    : "text-primary"
                                }`}
                              >
                                {progress}%
                              </span>
                            </div>

                            <div
                              role="progressbar"
                              aria-label={`Avance de las tareas visibles de ${workspace.name}`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={progress}
                              aria-valuetext={`${workspace.completedTaskCount} de ${workspace.taskCount} tareas completadas`}
                              className="mt-3 h-1.5 overflow-hidden rounded-full bg-border/50"
                            >
                              <div
                                style={{ width: `${progress}%` }}
                                className={`h-full rounded-full ${
                                  progress === 100 ? "bg-success" : "bg-primary"
                                }`}
                              />
                            </div>
                          </>
                        ) : (
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ClipboardList aria-hidden="true" size={16} />
                            Sin tareas visibles todavía
                          </p>
                        )}

                        {(workspace.overdueTaskCount > 0 ||
                          workspace.blockedTaskCount > 0) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {workspace.overdueTaskCount > 0 && (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-danger-soft px-2 py-1 text-xs font-medium text-danger">
                                <Clock3 aria-hidden="true" size={13} />
                                {workspace.overdueTaskCount}{" "}
                                {workspace.overdueTaskCount === 1
                                  ? "vencida"
                                  : "vencidas"}
                              </span>
                            )}

                            {workspace.blockedTaskCount > 0 && (
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-progress-soft px-2 py-1 text-xs font-medium text-progress">
                                <ShieldAlert aria-hidden="true" size={13} />
                                {workspace.blockedTaskCount}{" "}
                                {workspace.blockedTaskCount === 1
                                  ? "bloqueada"
                                  : "bloqueadas"}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Miembros */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 py-4">
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {workspace.members.length}
                          </span>{" "}
                          {workspace.members.length === 1
                            ? "miembro activo"
                            : "miembros activos"}
                        </p>

                        {workspace.members.length > 0 && (
                          <ul
                            aria-label="Miembros activos del espacio"
                            className="flex items-center -space-x-2"
                          >
                            {workspace.members.slice(0, 4).map((member) => (
                              <li key={member.id} title={member.name}>
                                <UserAvatar
                                  userId={member.id}
                                  name={member.name}
                                  avatarUrl={member.avatarUrl ?? null}
                                  className={`h-8 w-8 border-2 border-surface text-[10px] font-semibold text-white ${colors.icon}`}
                                />
                                <span className="sr-only">{member.name}</span>
                              </li>
                            ))}

                            {workspace.members.length > 4 && (
                              <li className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-surface bg-surface-muted text-[10px] font-semibold text-muted-foreground">
                                <span aria-hidden="true">
                                  +{workspace.members.length - 4}
                                </span>
                                <span className="sr-only">
                                  {workspace.members.length - 4} miembros
                                  adicionales
                                </span>
                              </li>
                            )}
                          </ul>
                        )}
                      </div>

                      {/* Fecha y acceso */}
                      <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
                        <div className="flex min-w-0 items-start gap-2 text-muted-foreground">
                          <CalendarDays
                            aria-hidden="true"
                            size={15}
                            className="mt-0.5 shrink-0"
                          />

                          <div className="min-w-0">
                            <p className="text-[11px]">Fecha de creación</p>

                            <time
                              dateTime={workspace.createdAt}
                              className="mt-0.5 block text-xs leading-5 text-foreground"
                            >
                              {creationDateFormatter.format(
                                new Date(workspace.createdAt),
                              )}
                            </time>
                          </div>
                        </div>

                        <Link
                          href={`/workspaces/${workspace.id}`}
                          aria-label={`Abrir espacio ${workspace.name}`}
                          className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <ArrowUpRight aria-hidden="true" size={18} />
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function LoadError() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-8">
      <h1 className="text-xl font-semibold">No pudimos cargar el área</h1>

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
