import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ListChecks,
  PencilLine,
  Plus,
  ShieldAlert,
} from "lucide-react";

import type { DashboardSummary } from "@/features/dashboard/schemas/dashboard.schema";
import { EmptyState } from "./dashboard-ui";

const activityDateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Mexico_City",
});

export default function RecentActivity({
  activity,
}: {
  activity: DashboardSummary["recentActivity"];
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
      <header className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-base font-semibold">Actividad del período</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Últimos movimientos registrados en las tareas.
          </p>
        </div>

        <ListChecks
          aria-hidden="true"
          size={20}
          className="shrink-0 text-[#579dff]"
        />
      </header>

      {activity.length === 0 ? (
        <EmptyState
          icon={CircleDot}
          title="Aún no hay movimientos"
          description="Las actualizaciones de tareas aparecerán en este espacio."
        />
      ) : (
        <ol className="divide-y divide-border/60">
          {activity.map((item) => {
            const presentation = getActivityPresentation(item.action);
            const Icon = presentation.icon;

            return (
              <li key={item.id} className="px-5 py-4 sm:px-6">
                <div className="flex gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{
                      color: presentation.color,
                      backgroundColor: presentation.softColor,
                    }}
                  >
                    <Icon aria-hidden="true" size={16} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm leading-5">
                      <span className="font-semibold">{item.actorName}</span>{" "}
                      <span className="text-muted-foreground">
                        {presentation.label}
                      </span>
                    </p>

                    <Link
                      href={`/tasks/${item.task.id}`}
                      className="mt-1 block truncate text-sm font-medium text-primary hover:underline"
                    >
                      {item.task.title}
                    </Link>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.task.workspace.name} ·{" "}
                      {activityDateFormatter.format(new Date(item.createdAt))}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </article>
  );
}

function getActivityPresentation(
  action: DashboardSummary["recentActivity"][number]["action"],
): {
  label: string;
  color: string;
  softColor: string;
  icon: LucideIcon;
} {
  switch (action) {
    case "CREATED":
      return {
        label: "creó la tarea",
        color: "#1769c2",
        softColor: "#eaf2ff",
        icon: Plus,
      };

    case "STATUS_CHANGED":
      return {
        label: "actualizó el estado de",
        color: "#008a52",
        softColor: "#e5f9ef",
        icon: CheckCircle2,
      };

    case "BLOCKED":
      return {
        label: "bloqueó",
        color: "#b4233f",
        softColor: "#ffedf1",
        icon: ShieldAlert,
      };

    case "UNBLOCKED":
      return {
        label: "desbloqueó",
        color: "#008a52",
        softColor: "#e5f9ef",
        icon: CheckCircle2,
      };

    case "BLOCK_REASON_CHANGED":
      return {
        label: "actualizó el motivo de bloqueo de",
        color: "#a86400",
        softColor: "#fff4dc",
        icon: AlertTriangle,
      };

    default:
      return {
        label: "editó",
        color: "#7a42b8",
        softColor: "#f4ebff",
        icon: PencilLine,
      };
  }
}
