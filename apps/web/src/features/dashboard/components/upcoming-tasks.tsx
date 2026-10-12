import Link from "next/link";
import { ArrowUpRight, CalendarClock } from "lucide-react";

import type { DashboardSummary } from "@/features/dashboard/schemas/dashboard.schema";
import { EmptyState } from "./dashboard-ui";
import {
  dueDateFormatter,
  getPriorityPresentation,
} from "./dashboard-task-presentations";

export default function UpcomingTasks({
  tasks,
}: {
  tasks: DashboardSummary["upcomingTasks"];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
      <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold">Próximas entregas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tareas abiertas con entrega futura en el período seleccionado.
          </p>
        </div>

        <CalendarClock
          aria-hidden="true"
          size={20}
          className="shrink-0 text-[#fdab3d]"
        />
      </header>

      {tasks.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Sin entregas próximas"
          description="No hay tareas abiertas con entrega futura en este período."
        />
      ) : (
        <ol className="divide-y divide-border/60">
          {tasks.map((task) => {
            const priority = getPriorityPresentation(task.priority);

            return (
              <li key={task.id}>
                <Link
                  href={`/tasks/${task.id}`}
                  className="group flex items-center gap-4 px-5 py-4 transition hover:bg-surface-hover sm:px-6"
                >
                  <time
                    dateTime={task.dueAt}
                    className="flex min-w-16 flex-col rounded-xl bg-[#fff4dc] px-2 py-2 text-center text-[#a86400]"
                  >
                    <span className="text-xs font-semibold uppercase">
                      {new Intl.DateTimeFormat("es-MX", {
                        month: "short",
                        timeZone: "America/Mexico_City",
                      })
                        .format(new Date(task.dueAt))
                        .replace(".", "")}
                    </span>

                    <span className="text-xl font-semibold leading-6">
                      {new Intl.DateTimeFormat("es-MX", {
                        day: "numeric",
                        timeZone: "America/Mexico_City",
                      }).format(new Date(task.dueAt))}
                    </span>
                  </time>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {task.title}
                    </p>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {task.workspace.area.name} · {task.workspace.name}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="rounded-md px-2 py-1 text-xs font-medium"
                        style={{
                          color: priority.color,
                          backgroundColor: priority.softColor,
                        }}
                      >
                        {priority.label}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {dueDateFormatter.format(new Date(task.dueAt))}
                      </span>
                    </div>
                  </div>

                  <ArrowUpRight
                    aria-hidden="true"
                    size={16}
                    className="shrink-0 text-muted-foreground transition group-hover:text-primary"
                  />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}
