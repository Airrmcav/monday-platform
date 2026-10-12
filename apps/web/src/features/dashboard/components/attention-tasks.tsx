import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Flag,
  ShieldAlert,
} from "lucide-react";

import type { DashboardSummary } from "@/features/dashboard/schemas/dashboard.schema";
import { EmptyState } from "./dashboard-ui";
import {
  dueDateFormatter,
  getPriorityPresentation,
} from "./dashboard-task-presentations";

export default function AttentionTasks({
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
            Vencimientos y prioridades de las tareas del período.
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
          description="No hay tareas vencidas ni urgentes dentro del período."
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
