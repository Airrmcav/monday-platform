import { redirect } from "next/navigation";

import { getCalendarTasks } from "@/features/tasks/tasks.service";
import TasksCalendar, {
  type CalendarTask,
} from "@/features/tasks/components/tasks-calendar";

const calendarTimeZone = "America/Mexico_City";

function getMexicoDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: calendarTimeZone,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function CalendarLoadError() {
  return (
    <section className="rounded-2xl border border-border bg-surface p-8">
      <h1 className="text-xl font-semibold">
        No pudimos cargar las tareas del calendario
      </h1>
      <p role="alert" className="mt-2 text-sm leading-6 text-muted-foreground">
        Intenta recargar la página en unos momentos. No mostramos resultados
        parciales para evitar omitir tareas de tus espacios.
      </p>
    </section>
  );
}

export default async function CalendarPage() {
  const result = await getCalendarTasks();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status !== "success") {
    return <CalendarLoadError />;
  }

  const tasks: CalendarTask[] = result.result.data.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt,
    isBlocked: task.isBlocked,
    parentId: task.parentId,
    parent: task.parent,
    workspace: task.workspace,
  }));

  const today = getMexicoDateKey(new Date());

  return (
    <TasksCalendar
      tasks={tasks}
      initialToday={today}
    />
  );
}
