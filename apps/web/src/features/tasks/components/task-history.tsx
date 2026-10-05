import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  ChevronDown,
  FilePenLine,
  History,
  LockKeyhole,
  MessageSquareText,
  Plus,
  UnlockKeyhole,
  type LucideIcon,
} from "lucide-react";

import { APP_TIME_ZONE } from "@/lib/date-time";
import type {
  TaskHistoryAction,
  TaskHistoryResponse,
} from "../schemas/task-history.schema";
import TaskHistoryChanges from "./task-history-changes";

type TaskHistoryProps = {
  taskId: string;
  result: TaskHistoryResponse;
};

const actionDetails: Record<
  TaskHistoryAction,
  {
    label: string;
    icon: LucideIcon;
    className: string;
  }
> = {
  CREATED: {
    label: "creó la tarea",
    icon: Plus,
    className: "bg-primary-soft text-primary",
  },
  UPDATED: {
    label: "editó la tarea",
    icon: FilePenLine,
    className: "bg-review-soft text-review",
  },
  STATUS_CHANGED: {
    label: "cambió el estado",
    icon: CheckCheck,
    className: "bg-primary-soft text-primary",
  },
  BLOCKED: {
    label: "bloqueó la tarea",
    icon: LockKeyhole,
    className: "bg-danger-soft text-danger",
  },
  UNBLOCKED: {
    label: "desbloqueó la tarea",
    icon: UnlockKeyhole,
    className: "bg-success-soft text-success",
  },
  BLOCK_REASON_CHANGED: {
    label: "actualizó el motivo del bloqueo",
    icon: MessageSquareText,
    className: "bg-progress-soft text-progress",
  },
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: APP_TIME_ZONE,
});

const paginationClassName =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const disabledPaginationClassName =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground opacity-50";

export default function TaskHistory({ taskId, result }: TaskHistoryProps) {
  const { data: entries, pagination } = result;
  const { page, pageSize, total, totalPages } = pagination;

  const firstEntry = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastEntry = Math.min(page * pageSize, total);

  function getPageHref(targetPage: number) {
    return {
      pathname: `/tasks/${taskId}`,
      query: {
        historyPage: String(targetPage),
        historyPageSize: String(pageSize),
      },
      hash: "task-history",
    };
  }

  return (
    <section
      id="task-history"
      aria-labelledby="task-history-title"
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm"
    >
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <History aria-hidden="true" size={21} />
          </span>

          <div>
            <h2 id="task-history-title" className="text-base font-semibold">
              Historial de la tarea
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Actividad más reciente primero.
            </p>
          </div>
        </div>

        <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          {total} {total === 1 ? "movimiento" : "movimientos"}
        </span>
      </header>

      {entries.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-background text-muted-foreground">
            <History aria-hidden="true" size={24} />
          </span>

          <h3 className="mt-4 text-sm font-semibold">
            No hay movimientos registrados
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Aquí aparecerán los cambios que se registren en esta tarea.
          </p>
        </div>
      ) : (
        <div className="p-5 sm:p-6">
          <p className="mb-6 text-xs text-muted-foreground">
            Fechas y horas de Ciudad de México.
          </p>

          <ol>
            {entries.map((entry, index) => {
              const action = actionDetails[entry.action];
              const Icon = action.icon;
              const isLast = index === entries.length - 1;

              return (
                <li
                  key={entry.id}
                  className={`relative pl-12 ${isLast ? "" : "pb-7"}`}
                >
                  {!isLast && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-4 top-9 w-px bg-border/70"
                    />
                  )}

                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full ${action.className}`}
                  >
                    <Icon size={16} />
                  </span>

                  <div className="min-w-0 pt-1">
                    <p className="wrap-break-words text-sm leading-6">
                      <span className="font-semibold">{entry.actorName}</span>{" "}
                      <span className="text-muted-foreground">
                        {action.label}
                      </span>
                    </p>

                    <time
                      dateTime={entry.createdAt}
                      className="mt-1 block text-xs leading-5 text-muted-foreground"
                    >
                      {dateFormatter.format(new Date(entry.createdAt))}
                    </time>

                    <details className="group mt-3 overflow-hidden rounded-xl border border-border/60">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl bg-background/50 px-4 py-3 text-xs font-medium text-primary transition-colors hover:bg-primary-soft/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                        {entry.action === "CREATED"
                          ? "Ver datos iniciales"
                          : "Ver cambios"}

                        <ChevronDown
                          aria-hidden="true"
                          size={16}
                          className="shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                        />
                      </summary>

                      <div className="border-t border-border/60 p-4">
                        <TaskHistoryChanges
                          action={entry.action}
                          changes={entry.changes}
                        />
                      </div>
                    </details>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {total > 0 && (
        <footer className="flex flex-col gap-4 border-t border-border/60 bg-background/40 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              Mostrando {firstEntry}–{lastEntry} de {total}
            </p>

            <p>
              Página {page} de {totalPages}
            </p>
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Paginación del historial"
              className="flex items-center justify-between gap-3"
            >
              {page > 1 ? (
                <Link
                  href={getPageHref(page - 1)}
                  prefetch={false}
                  className={paginationClassName}
                >
                  <ArrowLeft aria-hidden="true" size={15} />
                  Anterior
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={disabledPaginationClassName}
                >
                  <ArrowLeft aria-hidden="true" size={15} />
                  Anterior
                </span>
              )}

              {page < totalPages ? (
                <Link
                  href={getPageHref(page + 1)}
                  prefetch={false}
                  className={paginationClassName}
                >
                  Siguiente
                  <ArrowRight aria-hidden="true" size={15} />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className={disabledPaginationClassName}
                >
                  Siguiente
                  <ArrowRight aria-hidden="true" size={15} />
                </span>
              )}
            </nav>
          )}
        </footer>
      )}
    </section>
  );
}
