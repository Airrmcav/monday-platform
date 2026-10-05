import { APP_TIME_ZONE } from "@/lib/date-time";
import { Task } from "../schemas/tasks.schema";
import {
  ArrowUpRight,
  CalendarDays,
  GitBranch,
  Plus,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

type TaskSubtasksProps = {
  taskId: string;
  tasks: Task[];
  canCreate: boolean;
};

const statusDetails = {
  PENDING: {
    label: "Pendiente",
    className: "bg-pending-soft text-pending",
  },
  IN_PROGRESS: {
    label: "En progreso",
    className: "bg-progress-soft text-progress",
  },
  IN_REVIEW: {
    label: "En revisión",
    className: "bg-review-soft text-review",
  },
  COMPLETED: {
    label: "Completada",
    className: "bg-success-soft text-success",
  },
};

const priorityDetails = {
  LOW: {
    label: "Baja",
    className: "bg-pending-soft text-pending",
  },
  NORMAL: {
    label: "Normal",
    className: "bg-primary-soft text-primary",
  },
  HIGH: {
    label: "Alta",
    className: "bg-progress-soft text-progress",
  },
  URGENT: {
    label: "Urgente",
    className: "bg-danger-soft text-danger",
  },
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: APP_TIME_ZONE,
});

export default function TaskSubtasks({
  taskId,
  tasks,
  canCreate,
}: TaskSubtasksProps) {
  const completedCount = tasks.filter(
    (task) => task.status === "COMPLETED",
  ).length;

  const progress =
    tasks.length > 0 ? Math.floor((completedCount / tasks.length) * 100) : 0;
  return (
    <section
      aria-labelledby="task-subtasks-title"
      className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-sm"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <GitBranch aria-hidden="true" size={21} />
          </span>

          <div>
            <h2 id="task-subtasks-title" className="text-base font-semibold">
              Subtareas
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Trabajo asignado dentro de esta tarea.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            {tasks.length} {tasks.length === 1 ? "visible" : "visibles"}
          </span>

          {canCreate && (
            <Link
              href={`/tasks/${taskId}/subtasks/new`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Plus aria-hidden="true" size={15} />
              Crear subtarea
            </Link>
          )}
        </div>
      </header>

      {tasks.length > 0 && (
        <div className="border-b border-border/60 bg-background/30 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-muted-foreground">
              Avance de subtareas visibles
            </p>

            <span className="text-sm font-semibold tabular-nums text-primary">
              {progress}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-label="Avance de subtareas visibles"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-valuetext={`${completedCount} de ${tasks.length} subtareas visibles completadas`}
            className="mt-3 h-2 overflow-hidden rounded-full bg-border/50"
          >
            <div
              className={`h-full rounded-full ${
                progress === 100 ? "bg-success" : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            {completedCount} de {tasks.length} subtareas visibles completadas
          </p>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <GitBranch
            aria-hidden="true"
            size={28}
            className="mx-auto text-muted-foreground"
          />

          <h3 className="mt-3 text-sm font-semibold">
            No hay subtareas visibles
          </h3>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            Aquí aparecerán las subtareas a las que tengas acceso.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {tasks.map((task) => {
            const status = statusDetails[task.status];
            const priority = priorityDetails[task.priority];

            const responsibleNames = task.participants
              .filter((participant) => participant.role === "RESPONSIBLE")
              .map((participant) => participant.user.name);

            return (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="group block px-5 py-4 transition-colors hover:bg-primary-soft/30 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="wrap-break-words text-sm font-semibold transition-colors group-hover:text-primary">
                        {task.title}
                      </h3>

                      <p className="mt-1.5 wrap-break-words text-xs leading-5 text-muted-foreground">
                        Responsables:{" "}
                        {responsibleNames.join(", ") ||
                          "Sin responsables asignados"}
                      </p>
                    </div>

                    <ArrowUpRight
                      aria-hidden="true"
                      size={18}
                      className="mt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>

                    <span
                      className={`rounded-md px-2 py-1 text-xs font-medium ${priority.className}`}
                    >
                      Prioridad {priority.label.toLocaleLowerCase("es-MX")}
                    </span>

                    {task.isBlocked && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-danger-soft px-2 py-1 text-xs font-medium text-danger">
                        <ShieldAlert aria-hidden="true" size={13} />
                        Bloqueada
                      </span>
                    )}
                  </div>

                  <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
                    <CalendarDays
                      aria-hidden="true"
                      size={14}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      Entrega:{" "}
                      <time dateTime={task.dueAt}>
                        {dateFormatter.format(new Date(task.dueAt))}
                      </time>
                    </span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {tasks.length > 0 && (
        <footer className="border-t border-border/60 px-5 py-3 text-xs text-muted-foreground sm:px-6">
          Horarios de Ciudad de México.
        </footer>
      )}
    </section>
  );
}
