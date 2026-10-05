"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  Clock3,
  LockKeyhole,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type { Task, TaskStatus } from "../schemas/tasks.schema";
import TaskTableRow from "./task-table-row";
import TaskPriorityBadge from "./task-priority-badge";
import UserAvatar from "@/features/users/components/user-avatar";

type TaskTableProps = {
  tasks: Task[];
  asOf: number;
};

const statusStyles: Record<
  TaskStatus,
  {
    label: string;
    badge: string;
    border: string;
  }
> = {
  PENDING: {
    label: "Pendiente",
    badge: "bg-pending-soft text-pending",
    border: "border-l-pending",
  },
  IN_PROGRESS: {
    label: "En progreso",
    badge: "bg-progress-soft text-progress",
    border: "border-l-amber-400",
  },
  IN_REVIEW: {
    label: "En revisión",
    badge: "bg-review-soft text-review",
    border: "border-l-review",
  },
  COMPLETED: {
    label: "Completada",
    badge: "bg-success-soft text-success",
    border: "border-l-success",
  },
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

const timeFormatter = new Intl.DateTimeFormat("es-MX", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/Mexico_City",
});

type ParticipantListProps = {
  participants: Task["participants"];
  role: "RESPONSIBLE" | "COLLABORATOR";
};

function ParticipantList({ participants, role }: ParticipantListProps) {
  const users = participants
    .filter((participant) => participant.role === role)
    .map((participant) => participant.user);

  if (users.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        {role === "RESPONSIBLE" ? "Sin responsables" : "Sin colaboradores"}
      </span>
    );
  }

  const avatarColor =
    role === "RESPONSIBLE"
      ? "bg-primary-soft text-primary"
      : "bg-review-soft text-review";

  return (
    <ul className="space-y-2">
      {users.slice(0, 2).map((user) => (
        <li key={user.id} className="flex items-center gap-2">
          <UserAvatar
            userId={user.id}
            name={user.name}
            avatarUrl={user.avatarUrl ?? null}
            className={`h-7 w-7 text-[10px] font-semibold ${avatarColor}`}
          />

          <span title={user.name} className="min-w-0 truncate text-xs">
            {user.name}
          </span>
        </li>
      ))}

      {users.length > 2 && (
        <li
          title={users
            .slice(2)
            .map((user) => user.name)
            .join(", ")}
          className="pl-9 text-xs text-muted-foreground"
        >
          <span aria-hidden="true">+{users.length - 2} más</span>

          <span className="sr-only">
            Otros participantes:{" "}
            {users
              .slice(2)
              .map((user) => user.name)
              .join(", ")}
          </span>
        </li>
      )}
    </ul>
  );
}

type DeliveryAlert = {
  label: string;
  className: string;
};

function TaskDate({ value, alert }: { value: string; alert?: DeliveryAlert }) {
  const date = new Date(value);

  return (
    <div>
      <time dateTime={value} className="block">
        <span
          className={`block text-xs font-semibold ${
            alert ? alert.className : "text-foreground"
          }`}
        >
          {dateFormatter.format(date)}
        </span>

        <span className="mt-1 block text-xs text-muted-foreground">
          {timeFormatter.format(date)}
        </span>
      </time>

      {alert && (
        <span
          className={`mt-2 inline-flex items-center gap-1 text-[11px] font-medium ${alert.className}`}
        >
          <Clock3 aria-hidden="true" size={12} />
          {alert.label}
        </span>
      )}
    </div>
  );
}

export default function TasksTable({ tasks, asOf }: TaskTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<
    Task["priority"] | "ALL"
  >("ALL");
  const [attentionFilter, setAttentionFilter] = useState<
    "ALL" | "OVERDUE" | "UPCOMING" | "BLOCKED"
  >("ALL");
  const nextSevenDays = asOf + 7 * 24 * 60 * 60 * 1000;

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("es-MX");

    return tasks.filter((task) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          task.title,
          task.description ?? "",
          ...task.participants.map((participant) => participant.user.name),
        ]
          .join(" ")
          .toLocaleLowerCase("es-MX")
          .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "ALL" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "ALL" || task.priority === priorityFilter;
      const dueTime = Date.parse(task.dueAt);
      const isOpen = task.status !== "COMPLETED";
      const matchesAttention =
        attentionFilter === "ALL" ||
        (attentionFilter === "OVERDUE" && isOpen && dueTime < asOf) ||
        (attentionFilter === "UPCOMING" &&
          isOpen &&
          dueTime >= asOf &&
          dueTime <= nextSevenDays) ||
        (attentionFilter === "BLOCKED" && isOpen && task.isBlocked);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesAttention
      );
    });
  }, [
    asOf,
    attentionFilter,
    nextSevenDays,
    priorityFilter,
    search,
    statusFilter,
    tasks,
  ]);

  const hasActiveFilters =
    search !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    attentionFilter !== "ALL";

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setAttentionFilter("ALL");
  }

  return (
    <section
      aria-labelledby="tasks-title"
      className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm"
    >
      <header className="flex items-center justify-between gap-4 border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <ClipboardList aria-hidden="true" size={19} />
          </span>

          <div>
            <h2 id="tasks-title" className="text-sm font-semibold">
              Tareas del espacio
            </h2>

            <p className="mt-0.5 text-xs text-muted-foreground">
              Selecciona una tarea para abrir su detalle.
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-md bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {filteredTasks.length} de {tasks.length}{" "}
          {tasks.length === 1 ? "tarea" : "tareas"}
        </span>
      </header>

      <div className="grid gap-3 border-b border-border/60 bg-background/40 p-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_180px_190px_auto]">
        <label className="relative block">
          <span className="sr-only">Buscar tareas y participantes</span>
          <Search
            aria-hidden="true"
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar tarea o persona…"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </label>

        <label>
          <span className="sr-only">Filtrar por estado</span>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TaskStatus | "ALL")
            }
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="ALL">Todos los estados</option>
            {Object.entries(statusStyles).map(([value, status]) => (
              <option key={value} value={value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Filtrar por prioridad</span>
          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value as Task["priority"] | "ALL")
            }
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="ALL">Todas las prioridades</option>
            <option value="URGENT">Urgente</option>
            <option value="HIGH">Alta</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Baja</option>
          </select>
        </label>

        <label>
          <span className="sr-only">Filtrar por atención</span>
          <select
            value={attentionFilter}
            onChange={(event) =>
              setAttentionFilter(
                event.target.value as
                  | "ALL"
                  | "OVERDUE"
                  | "UPCOMING"
                  | "BLOCKED",
              )
            }
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="ALL">Cualquier fecha</option>
            <option value="OVERDUE">Vencidas</option>
            <option value="UPCOMING">Próximos 7 días</option>
            <option value="BLOCKED">Bloqueadas</option>
          </select>
        </label>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X aria-hidden="true" size={15} />
            Limpiar
          </button>
        ) : (
          <span className="hidden items-center justify-center gap-1.5 px-2 text-xs text-muted-foreground xl:inline-flex">
            <SlidersHorizontal aria-hidden="true" size={14} />
            Filtros
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ClipboardList aria-hidden="true" size={28} />
          </div>

          <h3 className="mt-4 text-base font-semibold">
            Todavía no hay tareas visibles
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Aquí aparecerán las tareas de este espacio a las que tengas acceso.
          </p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Search aria-hidden="true" size={26} />
          </div>

          <h3 className="mt-4 text-base font-semibold">
            No hay tareas con estos filtros
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Cambia los criterios o limpia los filtros para volver a ver todas
            las tareas del espacio.
          </p>

          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-ring"
          >
            <X aria-hidden="true" size={15} />
            Limpiar filtros
          </button>
        </div>
      ) : (
        <>
          <div
            role="region"
            aria-label="Listado de tareas"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-ring"
          >
            <table className="w-full min-w-300 table-fixed text-left text-sm">
              <caption className="sr-only">
                Tareas visibles, responsables, colaboradores, estados y fechas.
                Horarios de Ciudad de México.
              </caption>

              <colgroup>
                <col className="w-[28%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
                <col className="w-[10%]" />
              </colgroup>

              <thead className="border-b border-border/70 bg-background/80 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">
                    Tarea
                  </th>

                  <th
                    scope="col"
                    className="border-l border-border/50 px-4 py-3 font-medium"
                  >
                    Responsables
                  </th>

                  <th
                    scope="col"
                    className="border-l border-border/50 px-4 py-3 font-medium"
                  >
                    Colaboradores
                  </th>

                  <th
                    scope="col"
                    className="border-l border-border/50 px-3 py-3 text-center font-medium"
                  >
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="border-l border-border/50 px-3 py-3 text-center font-medium"
                  >
                    Prioridad
                  </th>

                  <th
                    scope="col"
                    className="border-l border-border/50 px-4 py-3 font-medium"
                  >
                    Asignación inicial
                  </th>

                  <th
                    scope="col"
                    className="border-l border-border/50 px-4 py-3 font-medium"
                  >
                    Entrega
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {filteredTasks.map((task) => {
                  const status = statusStyles[task.status];

                  const hoursRemaining =
                    (Date.parse(task.dueAt) - asOf) / (1000 * 60 * 60);

                  let deliveryAlert: DeliveryAlert | undefined;

                  if (task.status !== "COMPLETED") {
                    if (hoursRemaining < 0) {
                      deliveryAlert = {
                        label: "Vencida",
                        className: "text-danger",
                      };
                    } else if (hoursRemaining <= 24) {
                      deliveryAlert = {
                        label: "Próxima a vencer",
                        className: "text-danger",
                      };
                    } else if (hoursRemaining <= 72) {
                      deliveryAlert = {
                        label: "Entrega cercana",
                        className: "text-progress",
                      };
                    }
                  }

                  return (
                    <TaskTableRow key={task.id} href={`/tasks/${task.id}`}>
                      <th
                        scope="row"
                        className={`border-l-4 px-4 py-4 align-top font-normal ${status.border}`}
                      >
                        <Link
                          href={`/tasks/${task.id}`}
                          className="inline-flex max-w-full items-start gap-2 rounded font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        >
                          <span className="min-w-0 wrap-break-words">
                            {task.title}
                          </span>

                          <ArrowUpRight
                            aria-hidden="true"
                            size={15}
                            className="mt-0.5 shrink-0 text-muted-foreground"
                          />
                        </Link>

                        {task.description?.trim() && (
                          <p className="mt-1 line-clamp-1 wrap-break-words text-xs leading-5 text-muted-foreground">
                            {task.description}
                          </p>
                        )}

                        {task.isBlocked && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-danger-soft px-2 py-0.5 text-[11px] font-medium text-danger">
                              <LockKeyhole aria-hidden="true" size={12} />
                              Bloqueada
                            </span>

                            {task.blockedReason && (
                              <p
                                title={task.blockedReason}
                                className="mt-1 line-clamp-2 wrap-break-words text-xs leading-5 text-muted-foreground"
                              >
                                {task.blockedReason}
                              </p>
                            )}
                          </div>
                        )}
                      </th>

                      <td className="border-l border-border/40 px-4 py-4 align-top">
                        <ParticipantList
                          participants={task.participants}
                          role="RESPONSIBLE"
                        />
                      </td>

                      <td className="border-l border-border/40 px-4 py-4 align-top">
                        <ParticipantList
                          participants={task.participants}
                          role="COLLABORATOR"
                        />
                      </td>

                      <td className="border-l border-border/40 px-3 py-4 align-top">
                        <span
                          className={`flex min-h-8 items-center justify-center rounded-md px-2 py-1.5 text-center text-xs font-semibold ${status.badge}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="border-l border-border/40 px-3 py-4 text-center align-top">
                        <TaskPriorityBadge priority={task.priority} />
                      </td>

                      <td className="border-l border-border/40 px-4 py-4 align-top">
                        <TaskDate value={task.createdAt} />
                      </td>

                      <td className="border-l border-border/40 px-4 py-4 align-top">
                        <TaskDate value={task.dueAt} alert={deliveryAlert} />
                      </td>
                    </TaskTableRow>
                  );
                })}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-background/40 px-5 py-3 text-xs text-muted-foreground">
            <p>
              {filteredTasks.length} de {tasks.length}{" "}
              {filteredTasks.length === 1 ? "tarea visible" : "tareas visibles"}
            </p>

            <p>Horarios de Ciudad de México.</p>
          </footer>
        </>
      )}
    </section>
  );
}
