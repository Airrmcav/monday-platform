"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Filter,
  FolderKanban,
  ListTodo,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import type { ReportsData } from "../schemas/reports.schema";
import {
  dateFormatter,
  filterReportData,
  getTaskAnalytics,
  initialFilters,
  priorityLabelsForFilter,
  statusLabels,
  statusLabelsForFilter,
  type ReportFilters,
  type ReportKind,
} from "../lib/report-data";
import { createAreasWorkbook, createTasksWorkbook, downloadWorkbook } from "../lib/report-export";
import {
  DistributionCard,
  DueDistributionCard,
  FilterSelect,
  PriorityPill,
  ReportTypeButton,
  StatusPill,
  SummaryCard,
  TableHeading,
} from "./report-components";

export default function ReportsContent({ data }: { data: ReportsData }) {
  const [kind, setKind] = useState<ReportKind>("tasks");
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [generating, setGenerating] = useState<ReportKind | null>(null);
  const [error, setError] = useState<string | null>(null);
  const filteredData = useMemo(
    () => filterReportData(data, filters),
    [data, filters],
  );
  const analytics = useMemo(
    () => getTaskAnalytics(filteredData),
    [filteredData],
  );
  const availableWorkspaces = useMemo(
    () =>
      data.workspaces.filter(
        (workspace) =>
          filters.areaId === "ALL" || workspace.areaId === filters.areaId,
      ),
    [data.workspaces, filters.areaId],
  );
  const activeFilters = Object.values(filters).filter(
    (value) => value !== "" && value !== "ALL",
  ).length;

  const previewRows =
    kind === "tasks"
      ? filteredData.tasks.slice(0, 12)
      : filteredData.workspaces.slice(0, 12);

  function updateFilter<Key extends keyof ReportFilters>(
    key: Key,
    value: ReportFilters[Key],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function generateReport() {
    setGenerating(kind);
    setError(null);

    try {
      const workbook =
        kind === "areas"
          ? createAreasWorkbook(filteredData)
          : createTasksWorkbook(filteredData);
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Mexico_City",
      })
        .format(new Date())
        .replaceAll("-", "");
      await downloadWorkbook(
        workbook,
        `MYCAV-reporte-${kind}-${date}.xlsx`,
      );
    } catch {
      setError(
        "No se pudo generar el archivo de Excel. Intenta nuevamente.",
      );
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-[#d9e5f7] bg-linear-to-br from-[#f8fbff] via-surface to-[#eef5ff] px-5 py-6 shadow-(--shadow-panel) sm:px-7">
        <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full border-30 border-[#dcecff]/80" />
        <div className="absolute right-40 top-8 h-2.5 w-2.5 rounded-full bg-[#579dff]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <FileSpreadsheet aria-hidden="true" size={24} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold tracking-[0.15em] text-primary">
                MYCAV · ANÁLISIS Y EXPORTACIÓN
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                Centro de reportes
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Filtra la información y descarga exactamente lo que necesitas.
              </p>
            </div>
          </div>
          <div className="relative flex shrink-0 items-center gap-3 rounded-xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <CalendarDays aria-hidden="true" size={18} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Datos actualizados
              </p>
              <p className="mt-0.5 text-xs font-semibold text-foreground">
                {dateFormatter.format(new Date(data.generatedAt))}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Resumen de datos filtrados" className="grid gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Áreas"
          value={filteredData.areas.length}
          icon={FolderKanban}
          color="#579dff"
        />
        <SummaryCard
          label="Espacios"
          value={filteredData.workspaces.length}
          icon={FileSpreadsheet}
          color="#a25ddc"
        />
        <SummaryCard
          label="Tareas y subtareas"
          value={filteredData.tasks.length}
          icon={ListTodo}
          color="#00a873"
        />
      </section>

      {error && (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          <AlertCircle aria-hidden="true" size={17} />
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)">
        <header className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                aria-hidden="true"
                size={17}
                className="text-primary"
              />
              <h2 className="text-sm font-semibold">Configura tu reporte</h2>
              {activeFilters > 0 && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {activeFilters} filtros
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              La vista previa y el archivo Excel se actualizarán con estos
              criterios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ReportTypeButton
              active={kind === "tasks"}
              icon={ListTodo}
              onClick={() => setKind("tasks")}
            >
              Tareas
            </ReportTypeButton>
            <ReportTypeButton
              active={kind === "areas"}
              icon={FolderKanban}
              onClick={() => setKind("areas")}
            >
              Áreas y espacios
            </ReportTypeButton>
            <button
              type="button"
              onClick={() => setFilters(initialFilters)}
              disabled={activeFilters === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw aria-hidden="true" size={14} />
              Limpiar
            </button>
          </div>
        </header>

        <div className="grid gap-3 border-b border-border/60 bg-surface-muted/25 p-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <label className="relative sm:col-span-2 xl:col-span-2">
            <span className="sr-only">Buscar en el reporte</span>
            <Search
              aria-hidden="true"
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Buscar área, tarea, persona..."
              className="h-10 w-full rounded-lg border border-border/70 bg-surface pl-9 pr-3 text-xs outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </label>

          <FilterSelect
            label="Área"
            value={filters.areaId}
            onChange={(value) => {
              setFilters((current) => ({
                ...current,
                areaId: value,
                workspaceId: "ALL",
              }));
            }}
          >
            <option value="ALL">Todas las áreas</option>
            {data.areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}
              </option>
            ))}
          </FilterSelect>

          <FilterSelect
            label="Espacio"
            value={filters.workspaceId}
            onChange={(value) => updateFilter("workspaceId", value)}
          >
            <option value="ALL">Todos los espacios</option>
            {availableWorkspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </FilterSelect>

          {kind === "tasks" ? (
            <>
              <FilterSelect
                label="Estado"
                value={filters.status}
                onChange={(value) =>
                  updateFilter("status", value as ReportFilters["status"])
                }
              >
                {Object.entries(statusLabelsForFilter).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                label="Prioridad"
                value={filters.priority}
                onChange={(value) =>
                  updateFilter("priority", value as ReportFilters["priority"])
                }
              >
                {Object.entries(priorityLabelsForFilter).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </FilterSelect>
              <FilterSelect
                label="Bloqueo"
                value={filters.blocked}
                onChange={(value) =>
                  updateFilter("blocked", value as ReportFilters["blocked"])
                }
              >
                <option value="ALL">Cualquier estado</option>
                <option value="yes">Bloqueadas</option>
                <option value="no">Sin bloqueo</option>
              </FilterSelect>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-surface px-3 py-2 text-xs text-muted-foreground sm:col-span-2 xl:col-span-3">
              <Filter aria-hidden="true" size={15} className="shrink-0 text-primary" />
              Los filtros de estado, prioridad y fecha limitan las tareas
              contadas en cada espacio.
            </div>
          )}

          <label>
            <span className="mb-1 block text-[10px] font-medium text-muted-foreground">
              Entrega desde
            </span>
            <input
              type="date"
              value={filters.from}
              onChange={(event) => updateFilter("from", event.target.value)}
              className="h-10 w-full rounded-lg border border-border/70 bg-surface px-2.5 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-medium text-muted-foreground">
              Entrega hasta
            </span>
            <input
              type="date"
              value={filters.to}
              onChange={(event) => updateFilter("to", event.target.value)}
              className="h-10 w-full rounded-lg border border-border/70 bg-surface px-2.5 text-xs outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            />
          </label>
        </div>

        {kind === "tasks" && (
          <section
            aria-label="Resumen visual de tareas filtradas"
            className="space-y-3 border-b border-border/60 bg-surface-muted/15 p-4 sm:p-5"
          >
            <header className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <BarChart3 aria-hidden="true" size={16} />
              </span>
              <div>
                <h3 className="text-sm font-semibold">Panorama del reporte</h3>
                <p className="text-[11px] text-muted-foreground">
                  Distribuciones calculadas sobre las {filteredData.tasks.length} tareas visibles.
                </p>
              </div>
            </header>

            <div className="grid gap-3 lg:grid-cols-2">
              <DistributionCard
                title="Tareas por estado"
                items={analytics.statusItems}
              />
              <DistributionCard
                title="Tareas por prioridad"
                items={analytics.priorityItems}
              />
              <DistributionCard
                title="Carga por área"
                items={analytics.areaItems}
                emptyLabel="No hay tareas para mostrar por área."
              />
              <DueDistributionCard items={analytics.dueItems} />
            </div>
          </section>
        )}

        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="text-sm font-semibold">
              {kind === "tasks" ? "Vista previa de tareas" : "Vista previa de espacios"}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {kind === "tasks"
                ? `${filteredData.tasks.length} de ${data.tasks.length} tareas y subtareas`
                : `${filteredData.workspaces.length} espacios · ${filteredData.areas.length} áreas`}
              {previewRows.length > 0 && previewRows.length < (
                kind === "tasks"
                  ? filteredData.tasks.length
                  : filteredData.workspaces.length
              )
                ? ` · mostrando ${previewRows.length}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            disabled={
              generating !== null ||
              (kind === "tasks"
                ? filteredData.tasks.length === 0
                : filteredData.areas.length === 0)
            }
            onClick={() => void generateReport()}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download aria-hidden="true" size={16} />
            {generating ? "Generando Excel..." : "Descargar Excel"}
          </button>
        </div>

        <div className="overflow-x-auto border-t border-border/60">
          {previewRows.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground">
                <Search aria-hidden="true" size={19} />
              </span>
              <p className="mt-3 text-sm font-semibold">
                No hay datos con estos filtros
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Cambia o limpia los criterios para ver resultados.
              </p>
            </div>
          ) : kind === "tasks" ? (
            <table className="w-full min-w-[920px] border-collapse text-left">
              <thead className="bg-surface-muted/50">
                <tr>
                  <TableHeading>Tarea</TableHeading>
                  <TableHeading>Área / espacio</TableHeading>
                  <TableHeading>Estado</TableHeading>
                  <TableHeading>Prioridad</TableHeading>
                  <TableHeading>Responsables</TableHeading>
                  <TableHeading>Entrega</TableHeading>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredData.tasks.slice(0, 12).map((task) => (
                  <tr key={task.id} className="hover:bg-primary-soft/20">
                    <td className="max-w-64 px-4 py-3">
                      <p className="truncate text-xs font-semibold text-foreground">
                        {task.parentId && (
                          <span className="mr-1 text-primary">↳</span>
                        )}
                        {task.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {task.parentId ? "Subtarea" : "Tarea"} · {task.id}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <p className="font-medium">{task.workspace.area.name}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {task.workspace.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill>{statusLabels[task.status]}</StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <PriorityPill priority={task.priority} />
                    </td>
                    <td className="max-w-48 px-4 py-3 text-xs text-muted-foreground">
                      {task.participants
                        .filter((participant) => participant.role === "RESPONSIBLE")
                        .map((participant) => participant.name)
                        .join(", ") || "Sin asignar"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(task.dueAt))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead className="bg-surface-muted/50">
                <tr>
                  <TableHeading>Espacio</TableHeading>
                  <TableHeading>Área</TableHeading>
                  <TableHeading>Descripción</TableHeading>
                  <TableHeading>Miembros</TableHeading>
                  <TableHeading>Tareas coincidentes</TableHeading>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredData.workspaces.slice(0, 12).map((workspace) => (
                  <tr key={workspace.id} className="hover:bg-primary-soft/20">
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold">{workspace.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {workspace.id}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {workspace.area.name}
                    </td>
                    <td className="max-w-60 px-4 py-3 text-xs text-muted-foreground">
                      <p className="line-clamp-2">
                        {workspace.description || "Sin descripción"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {workspace.members.length}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold tabular-nums">
                      {filteredData.tasks.filter(
                        (task) => task.workspaceId === workspace.id,
                      ).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {previewRows.length > 0 && (
          <footer className="border-t border-border/60 px-4 py-2.5 text-[10px] text-muted-foreground sm:px-5">
            La vista previa muestra hasta 12 filas. El archivo Excel incluye
            todos los resultados que coinciden con los filtros.
          </footer>
        )}
      </section>

      <p className="px-1 text-[11px] leading-5 text-muted-foreground">
        Solo se exporta información activa que tu cuenta tiene permiso para
        consultar. Comentarios, historial y metadatos de archivos se incluyen
        únicamente en el reporte de tareas.
      </p>
    </div>
  );
}
