"use client";

import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type { Task, TaskStatus } from "../schemas/tasks.schema";

export type TaskAttentionFilter = "ALL" | "OVERDUE" | "UPCOMING" | "BLOCKED";

type TaskTableFiltersProps = {
  search: string;
  statusFilter: TaskStatus | "ALL";
  priorityFilter: Task["priority"] | "ALL";
  attentionFilter: TaskAttentionFilter;
  hasActiveFilters: boolean;
  statusOptions: Array<{ value: TaskStatus; label: string }>;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: TaskStatus | "ALL") => void;
  onPriorityChange: (value: Task["priority"] | "ALL") => void;
  onAttentionChange: (value: TaskAttentionFilter) => void;
  onClearFilters: () => void;
};

export default function TaskTableFilters({
  search,
  statusFilter,
  priorityFilter,
  attentionFilter,
  hasActiveFilters,
  statusOptions,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onAttentionChange,
  onClearFilters,
}: TaskTableFiltersProps) {
  return (
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
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar tarea o persona…"
          className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </label>

      <label>
        <span className="sr-only">Filtrar por estado</span>
        <select
          value={statusFilter}
          onChange={(event) =>
            onStatusChange(event.target.value as TaskStatus | "ALL")
          }
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          <option value="ALL">Todos los estados</option>
          {statusOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="sr-only">Filtrar por prioridad</span>
        <select
          value={priorityFilter}
          onChange={(event) =>
            onPriorityChange(event.target.value as Task["priority"] | "ALL")
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
            onAttentionChange(event.target.value as TaskAttentionFilter)
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
          onClick={onClearFilters}
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
  );
}
