import { redirect } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
} from "lucide-react";

import LogoutButton from "@/features/auth/components/logout-button";
import { getDashboardSummary } from "../dashboard.service";
import type { DashboardPeriodSelection } from "../period";
import AttentionTasks from "./attention-tasks";
import {
  DashboardMetricCard,
  WorkStatusChart,
} from "./dashboard-metrics";
import DashboardPeriodSelector from "./dashboard-period-selector";
import RecentActivity from "./recent-activity";
import TeamUserStatus from "./team-user-status";
import { DashboardNotice } from "./dashboard-ui";
import UpcomingTasks from "./upcoming-tasks";

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

export default async function DashboardPage({
  selection,
}: {
  selection: DashboardPeriodSelection;
}) {
  const dashboardResult = await getDashboardSummary(
    selection.period,
    selection.date,
  );

  if (dashboardResult.status === "unauthenticated") {
    redirect("/login");
  }

  if (dashboardResult.status === "forbidden") {
    return (
      <DashboardNotice
        title="No tienes acceso activo"
        message="Contacta al administrador de la plataforma para recuperar tu acceso."
      />
    );
  }

  if (dashboardResult.status === "unavailable") {
    return (
      <DashboardNotice
        title="No pudimos cargar el dashboard"
        message="Intenta recargar la página en unos momentos."
      />
    );
  }

  const {
    viewer,
    metrics,
    tasksByStatus,
    tasksByPriority,
    teamUsers,
    attentionTasks,
    upcomingTasks,
    recentActivity,
  } = dashboardResult.result;

  return (
    <div className="mx-auto w-full space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-[#d9e5f7] bg-linear-to-br from-[#f8fbff] via-surface to-[#eef5ff] px-6 py-7 shadow-(--shadow-panel) sm:px-8">
        <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full border-30 border-[#dcecff]/80" />
        <div className="absolute right-28 top-10 h-3 w-3 rounded-full bg-[#579dff]" />
        <div className="absolute right-20 top-28 h-2 w-2 rounded-full bg-[#a25ddc]" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-primary">
              <LayoutDashboard aria-hidden="true" size={16} />
              MYCAV ·{" "}
              {viewer.isAdmin
                ? "VISTA GLOBAL DE LA PLATAFORMA"
                : "RESUMEN DE TU TRABAJO"}
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Hola, {viewer.name}
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {dateFormatter.format(new Date())}
            </p>

            <TeamUserStatus users={teamUsers} />
          </div>

          <div className="relative shrink-0">
            <LogoutButton />
          </div>
        </div>
      </section>

      <DashboardPeriodSelector
        basePath="/dashboard"
        period={selection.period}
        date={selection.date}
        today={selection.today}
      />

      <section aria-label="Métricas principales">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardMetricCard
            label="Espacios activos"
            value={metrics.activeWorkspaces}
            description="Estado actual, sin filtro de período"
            icon={Building2}
            color="#579dff"
            softColor="#eaf2ff"
          />

          <DashboardMetricCard
            label="Tareas activas"
            value={metrics.activeTasks}
            description={`${metrics.totalTasks} tareas en el período`}
            icon={ClipboardList}
            color="#a25ddc"
            softColor="#f4ebff"
          />

          <DashboardMetricCard
            label="Tareas vencidas"
            value={metrics.overdueTasks}
            description={
              metrics.overdueTasks === 0
                ? "El equipo está al día"
                : "Requieren atención inmediata"
            }
            icon={AlertTriangle}
            color="#e2445c"
            softColor="#ffedf1"
          />

          <DashboardMetricCard
            label="Entregas en el período"
            value={metrics.dueInPeriod}
            description="Tareas abiertas con vencimiento en el rango"
            icon={CalendarClock}
            color="#fdab3d"
            softColor="#fff4dc"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <WorkStatusChart
          metrics={metrics}
          tasksByStatus={tasksByStatus}
          tasksByPriority={tasksByPriority}
        />

        <AttentionTasks tasks={attentionTasks} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <UpcomingTasks tasks={upcomingTasks} />

        <RecentActivity activity={recentActivity} />
      </section>
    </div>
  );
}
