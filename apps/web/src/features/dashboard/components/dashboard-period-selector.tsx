"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays } from "lucide-react";

import type { DashboardPeriod } from "../period";

type DashboardPeriodSelectorProps = {
  basePath: string;
  period: DashboardPeriod;
  date: string;
  today: string;
  focus?: "all" | "overdue" | "upcoming";
};

const monthFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const weekFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function shiftDate(dateKey: string, period: DashboardPeriod, amount: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  if (period === "week") {
    date.setUTCDate(date.getUTCDate() + amount * 7);
  } else {
    const day = date.getUTCDate();
    date.setUTCDate(1);
    date.setUTCMonth(date.getUTCMonth() + amount);
    const lastDay = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
    ).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
  }

  return date.toISOString().slice(0, 10);
}

function getPeriodLabel(period: DashboardPeriod, dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  if (period === "month") {
    return monthFormatter.format(date);
  }

  const mondayOffset = (date.getUTCDay() + 6) % 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);

  return `${weekFormatter.format(monday)} – ${weekFormatter.format(sunday)}${
    monday.getUTCFullYear() === sunday.getUTCFullYear()
      ? ` ${sunday.getUTCFullYear()}`
      : ` ${monday.getUTCFullYear()} – ${sunday.getUTCFullYear()}`
  }`;
}

function periodHref(
  basePath: string,
  period: DashboardPeriod,
  date: string,
  focus: DashboardPeriodSelectorProps["focus"],
) {
  const query = new URLSearchParams({ period, date });

  if (focus && focus !== "all") {
    query.set("focus", focus);
  }

  return `${basePath}?${query.toString()}`;
}

export default function DashboardPeriodSelector({
  basePath,
  period,
  date,
  today,
  focus,
}: DashboardPeriodSelectorProps) {
  return (
    <section
      aria-label="Período del resumen"
      className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-surface p-4 shadow-(--shadow-panel) sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <CalendarDays aria-hidden="true" size={19} />
        </span>
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {period === "week" ? "Semana seleccionada" : "Mes seleccionado"}
          </p>
          <p className="mt-0.5 text-sm font-semibold capitalize">
            {getPeriodLabel(period, date)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          aria-label="Cambiar período"
          className="flex rounded-lg border border-border/70 bg-surface-muted/50 p-1"
          role="group"
        >
          {(["month", "week"] as const).map((option) => (
            <Link
              key={option}
              aria-current={period === option ? "page" : undefined}
              href={periodHref(basePath, option, date, focus)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === option
                  ? "bg-surface text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option === "month" ? "Mes" : "Semana"}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Link
            aria-label={period === "week" ? "Semana anterior" : "Mes anterior"}
            href={periodHref(
              basePath,
              period,
              shiftDate(date, period, -1),
              focus,
            )}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <ArrowLeft aria-hidden="true" size={16} />
          </Link>
          <Link
            href={periodHref(basePath, period, today, focus)}
            aria-current={date === today ? "date" : undefined}
            className="rounded-lg border border-border/70 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-surface-muted"
          >
            Hoy
          </Link>
          <Link
            aria-label={period === "week" ? "Semana siguiente" : "Mes siguiente"}
            href={periodHref(
              basePath,
              period,
              shiftDate(date, period, 1),
              focus,
            )}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
