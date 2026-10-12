import type { ReactNode } from "react";
import { ChevronDown, Clock3, FolderKanban } from "lucide-react";

import { type ChartItem, type TaskPriority, priorityLabels } from "../lib/report-data";

export function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof FolderKanban;
  color: string;
}) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface px-4 py-3 shadow-(--shadow-panel)">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon aria-hidden="true" size={18} />
      </span>
      <div>
        <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </article>
  );
}

export function DistributionCard({
  title,
  items,
  emptyLabel = "No hay tareas en este reporte.",
}: {
  title: string;
  items: ChartItem[];
  emptyLabel?: string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...items.map((item) => item.value), 0);

  return (
    <article className="rounded-xl border border-border/70 bg-surface p-4">
      <header className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold">{title}</h4>
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          {total} {total === 1 ? "tarea" : "tareas"}
        </span>
      </header>
      {total === 0 ? (
        <p className="mt-4 rounded-lg bg-surface-muted/50 px-3 py-4 text-center text-[11px] text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <>
          <div
            aria-hidden="true"
            className="mt-3 flex h-2 overflow-hidden rounded-full bg-surface-muted"
          >
            {items.map(
              (item) =>
                item.value > 0 && (
                  <span
                    key={item.label}
                    className="h-full transition-[width]"
                    style={{
                      width: `${(item.value / total) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                ),
            )}
          </div>
          <dl className="mt-3 space-y-2">
            {items.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-[minmax(0,1fr)_minmax(72px,1.2fr)_auto] items-center gap-2"
              >
                <dt className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.label}</span>
                </dt>
                <dd className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <span
                    className="block h-full rounded-full transition-[width]"
                    style={{
                      width: `${
                        maxValue === 0 ? 0 : (item.value / maxValue) * 100
                      }%`,
                      backgroundColor: item.color,
                    }}
                  />
                </dd>
                <dd className="min-w-7 text-right text-[11px] font-semibold tabular-nums">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </article>
  );
}

export function DueDistributionCard({ items }: { items: ChartItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="rounded-xl border border-border/70 bg-surface p-4">
      <header className="flex items-center justify-between gap-3">
        <h4 className="flex items-center gap-2 text-xs font-semibold">
          <Clock3 aria-hidden="true" size={15} className="text-primary" />
          Entregas y vencimientos
        </h4>
        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
          {total} {total === 1 ? "tarea" : "tareas"}
        </span>
      </header>
      {total === 0 ? (
        <p className="mt-4 rounded-lg bg-surface-muted/50 px-3 py-4 text-center text-[11px] text-muted-foreground">
          No hay tareas en este reporte.
        </p>
      ) : (
        <>
          <div
            aria-hidden="true"
            className="mt-3 flex h-2 overflow-hidden rounded-full bg-surface-muted"
          >
            {items.map(
              (item) =>
                item.value > 0 && (
                  <span
                    key={item.label}
                    className="h-full"
                    style={{
                      width: `${(item.value / total) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                ),
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex min-h-12 items-center justify-between gap-2 rounded-lg border border-border/50 px-2.5 py-2"
              >
                <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                <span className="text-xs font-semibold tabular-nums">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  );
}

export function ReportTypeButton({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: typeof FolderKanban;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
        active
          ? "border-primary/20 bg-primary-soft text-primary"
          : "border-border/70 bg-surface text-muted-foreground hover:bg-surface-muted hover:text-foreground"
      }`}
    >
      <Icon aria-hidden="true" size={15} />
      {children}
    </button>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label>
      <span className="mb-1 block text-[10px] font-medium text-muted-foreground">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-lg border border-border/70 bg-surface py-2 pl-2.5 pr-7 text-xs text-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
      </span>
    </label>
  );
}

export function TableHeading({ children }: { children: string }) {
  return (
    <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  );
}

export function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-md bg-surface-muted px-2 py-1 text-[10px] font-semibold text-foreground">
      {children}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  const colors: Record<TaskPriority, string> = {
    LOW: "bg-[#eaf2ff] text-[#2f73ce]",
    NORMAL: "bg-surface-muted text-muted-foreground",
    HIGH: "bg-[#fff4dc] text-[#a86400]",
    URGENT: "bg-[#ffedf1] text-[#c43850]",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold ${colors[priority]}`}
    >
      {priorityLabels[priority]}
    </span>
  );
}
