"use client";

import ExcelJS from "exceljs";
import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clock3,
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

type ReportKind = "areas" | "tasks";
type TaskStatus = ReportsData["tasks"][number]["status"];
type TaskPriority = ReportsData["tasks"][number]["priority"];

type ReportFilters = {
  search: string;
  areaId: string;
  workspaceId: string;
  status: "ALL" | TaskStatus;
  priority: "ALL" | TaskPriority;
  from: string;
  to: string;
  blocked: "ALL" | "yes" | "no";
};

type ChartItem = {
  label: string;
  value: number;
  color: string;
};

const initialFilters: ReportFilters = {
  search: "",
  areaId: "ALL",
  workspaceId: "ALL",
  status: "ALL",
  priority: "ALL",
  from: "",
  to: "",
  blocked: "ALL",
};

const statusLabels = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  COMPLETED: "Completada",
} as const;

const priorityLabels = {
  LOW: "Baja",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
} as const;

const statusColors: Record<TaskStatus, string> = {
  PENDING: "#94a3b8",
  IN_PROGRESS: "#579dff",
  IN_REVIEW: "#a25ddc",
  COMPLETED: "#00c875",
};

const priorityColors: Record<TaskPriority, string> = {
  LOW: "#579dff",
  NORMAL: "#94a3b8",
  HIGH: "#fdab3d",
  URGENT: "#e2445c",
};

const statusLabelsForFilter = {
  ALL: "Todos los estados",
  ...statusLabels,
} as const;

const priorityLabelsForFilter = {
  ALL: "Todas las prioridades",
  ...priorityLabels,
} as const;

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

function formatDate(value: string | null) {
  return value ? new Date(value) : null;
}

function toMexicoDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function shiftDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function matchesSearch(value: string, query: string) {
  return value.toLocaleLowerCase("es-MX").includes(query);
}

function filterReportData(data: ReportsData, filters: ReportFilters) {
  const query = filters.search.trim().toLocaleLowerCase("es-MX");
  const workspaces = data.workspaces.filter((workspace) => {
    const matchesArea =
      filters.areaId === "ALL" || workspace.areaId === filters.areaId;
    const matchesWorkspace =
      filters.workspaceId === "ALL" || workspace.id === filters.workspaceId;
    const matchesText =
      !query ||
      matchesSearch(
        [
          workspace.name,
          workspace.description ?? "",
          workspace.area.name,
          workspace.createdBy.name,
          ...workspace.members.map((member) => member.name),
        ].join(" "),
        query,
      ) ||
      data.tasks.some(
        (task) =>
          task.workspaceId === workspace.id &&
          matchesSearch(
            [
              task.title,
              task.description ?? "",
              task.createdBy.name,
              task.parent?.title ?? "",
              ...task.participants.map((participant) => participant.name),
            ].join(" "),
            query,
          ),
      );

    return matchesArea && matchesWorkspace && matchesText;
  });
  const visibleWorkspaceIds = new Set(workspaces.map((workspace) => workspace.id));
  const tasks = data.tasks.filter((task) => {
    const matchesLocation = visibleWorkspaceIds.has(task.workspaceId);
    const matchesStatus =
      filters.status === "ALL" || task.status === filters.status;
    const matchesPriority =
      filters.priority === "ALL" || task.priority === filters.priority;
    const dueDate = toMexicoDateKey(task.dueAt);
    const matchesFrom = !filters.from || dueDate >= filters.from;
    const matchesTo = !filters.to || dueDate <= filters.to;
    const matchesBlocked =
      filters.blocked === "ALL" ||
      (filters.blocked === "yes" ? task.isBlocked : !task.isBlocked);
    const matchesText =
      !query ||
      matchesSearch(
        [
          task.title,
          task.description ?? "",
          task.workspace.name,
          task.workspace.area.name,
          task.createdBy.name,
          task.parent?.title ?? "",
          ...task.participants.map((participant) => participant.name),
        ].join(" "),
        query,
      );

    return (
      matchesLocation &&
      matchesStatus &&
      matchesPriority &&
      matchesFrom &&
      matchesTo &&
      matchesBlocked &&
      matchesText
    );
  });
  const areas = data.areas.filter((area) => {
    const matchesArea =
      filters.areaId === "ALL" || area.id === filters.areaId;
    const hasWorkspace =
      filters.workspaceId === "ALL" ||
      workspaces.some((workspace) => workspace.areaId === area.id);
    const matchesText =
      !query ||
      matchesSearch(area.name, query) ||
      workspaces.some(
        (workspace) =>
          workspace.areaId === area.id &&
          matchesSearch(
            `${workspace.name} ${workspace.description ?? ""}`,
            query,
          ),
      );

    return matchesArea && hasWorkspace && matchesText;
  });
  return {
    generatedAt: data.generatedAt,
    areas,
    workspaces,
    tasks,
  } satisfies ReportsData;
}

function getTaskAnalytics(data: ReportsData) {
  const statusItems = (
    Object.keys(statusLabels) as TaskStatus[]
  ).map((status) => ({
    label: statusLabels[status],
    value: data.tasks.filter((task) => task.status === status).length,
    color: statusColors[status],
  }));
  const priorityItems = (
    Object.keys(priorityLabels) as TaskPriority[]
  ).map((priority) => ({
    label: priorityLabels[priority],
    value: data.tasks.filter((task) => task.priority === priority).length,
    color: priorityColors[priority],
  }));

  const countsByArea = new Map<string, ChartItem>();
  for (const task of data.tasks) {
    const key = task.workspace.area.id;
    const current = countsByArea.get(key);
    countsByArea.set(key, {
      label: task.workspace.area.name,
      value: (current?.value ?? 0) + 1,
      color: "#579dff",
    });
  }

  const today = toMexicoDateKey(data.generatedAt);
  const nextWeek = shiftDateKey(today, 7);
  const dueItems: ChartItem[] = [
    {
      label: "Vencidas",
      value: data.tasks.filter(
        (task) =>
          task.status !== "COMPLETED" && toMexicoDateKey(task.dueAt) < today,
      ).length,
      color: "#e2445c",
    },
    {
      label: "Próximos 7 días",
      value: data.tasks.filter((task) => {
        const due = toMexicoDateKey(task.dueAt);
        return (
          task.status !== "COMPLETED" && due >= today && due < nextWeek
        );
      }).length,
      color: "#fdab3d",
    },
    {
      label: "Más adelante",
      value: data.tasks.filter(
        (task) =>
          task.status !== "COMPLETED" &&
          toMexicoDateKey(task.dueAt) >= nextWeek,
      ).length,
      color: "#579dff",
    },
    {
      label: "Completadas",
      value: data.tasks.filter((task) => task.status === "COMPLETED").length,
      color: "#00c875",
    },
  ];
  const sortedAreas = [...countsByArea.values()].sort(
    (left, right) =>
      right.value - left.value || left.label.localeCompare(right.label, "es"),
  );
  const topAreas = sortedAreas.slice(0, 5);
  const remainingAreaTasks = sortedAreas
    .slice(5)
    .reduce((sum, item) => sum + item.value, 0);

  if (remainingAreaTasks > 0) {
    topAreas.push({
      label: "Otras áreas",
      value: remainingAreaTasks,
      color: "#a25ddc",
    });
  }

  return {
    statusItems,
    priorityItems,
    areaItems: topAreas,
    dueItems,
  };
}

function styleWorksheet(worksheet: ExcelJS.Worksheet) {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.autoFilter = {
    from: "A1",
    to: `${worksheet.getColumn(worksheet.columnCount).letter}1`,
  };
  worksheet.getRow(1).height = 28;
  worksheet.getRow(1).eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F5FAF" },
    };
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 11,
    };
    cell.alignment = { vertical: "middle", wrapText: true };
  });

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: "top", wrapText: true };
    }
  });
}

function addRows(
  workbook: ExcelJS.Workbook,
  name: string,
  columns: Partial<ExcelJS.Column>[],
  rows: Record<string, ExcelJS.CellValue>[],
) {
  const worksheet = workbook.addWorksheet(name);
  worksheet.columns = columns;
  worksheet.addRows(rows);
  styleWorksheet(worksheet);
  return worksheet;
}

function createAreasWorkbook(data: ReportsData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MYCAV";
  workbook.created = new Date(data.generatedAt);
  workbook.subject = "Reporte de áreas y espacios de trabajo";

  const workspaceCountByArea = new Map<string, number>();
  const taskCountByArea = new Map<string, number>();
  const taskCountByWorkspace = new Map<string, number>();

  for (const workspace of data.workspaces) {
    workspaceCountByArea.set(
      workspace.areaId,
      (workspaceCountByArea.get(workspace.areaId) ?? 0) + 1,
    );
  }

  for (const task of data.tasks) {
    taskCountByArea.set(
      task.workspace.area.id,
      (taskCountByArea.get(task.workspace.area.id) ?? 0) + 1,
    );
    taskCountByWorkspace.set(
      task.workspaceId,
      (taskCountByWorkspace.get(task.workspaceId) ?? 0) + 1,
    );
  }

  addRows(
    workbook,
    "Áreas",
    [
      { header: "ID del área", key: "id", width: 38 },
      { header: "Área de trabajo", key: "name", width: 32 },
      { header: "Espacios", key: "workspaceCount", width: 14 },
      { header: "Tareas visibles", key: "taskCount", width: 16 },
      { header: "Creada", key: "createdAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
      { header: "Actualizada", key: "updatedAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
    ],
    data.areas.map((area) => ({
      id: area.id,
      name: area.name,
      workspaceCount: workspaceCountByArea.get(area.id) ?? 0,
      taskCount: taskCountByArea.get(area.id) ?? 0,
      createdAt: new Date(area.createdAt),
      updatedAt: new Date(area.updatedAt),
    })),
  );

  addRows(
    workbook,
    "Espacios",
    [
      { header: "ID del espacio", key: "id", width: 38 },
      { header: "Espacio de trabajo", key: "name", width: 32 },
      { header: "Descripción", key: "description", width: 48 },
      { header: "Área", key: "area", width: 28 },
      { header: "ID del área", key: "areaId", width: 38 },
      { header: "Creador", key: "creator", width: 28 },
      { header: "ID del creador", key: "creatorId", width: 38 },
      { header: "Miembros", key: "members", width: 55 },
      { header: "Tareas visibles", key: "taskCount", width: 16 },
      { header: "Creado", key: "createdAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
      { header: "Actualizado", key: "updatedAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
    ],
    data.workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description ?? "",
      area: workspace.area.name,
      areaId: workspace.areaId,
      creator: workspace.createdBy.name,
      creatorId: workspace.createdById,
      members: workspace.members
        .map((member) => `${member.name} (${member.id})`)
        .join("; "),
      taskCount: taskCountByWorkspace.get(workspace.id) ?? 0,
      createdAt: new Date(workspace.createdAt),
      updatedAt: new Date(workspace.updatedAt),
    })),
  );

  return workbook;
}

function createTasksWorkbook(data: ReportsData) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "MYCAV";
  workbook.created = new Date(data.generatedAt);
  workbook.subject = "Reporte detallado de tareas";

  addRows(
    workbook,
    "Tareas",
    [
      { header: "ID de la tarea", key: "id", width: 38 },
      { header: "Tipo", key: "kind", width: 14 },
      { header: "Tarea principal", key: "parentTitle", width: 34 },
      { header: "ID de tarea principal", key: "parentId", width: 38 },
      { header: "Área", key: "area", width: 26 },
      { header: "ID del área", key: "areaId", width: 38 },
      { header: "Espacio", key: "workspace", width: 28 },
      { header: "ID del espacio", key: "workspaceId", width: 38 },
      { header: "Título", key: "title", width: 42 },
      { header: "Descripción", key: "description", width: 60 },
      { header: "Estado", key: "status", width: 18 },
      { header: "Prioridad", key: "priority", width: 16 },
      { header: "Bloqueada", key: "blocked", width: 14 },
      { header: "Motivo del bloqueo", key: "blockedReason", width: 48 },
      { header: "Responsables", key: "responsibles", width: 55 },
      { header: "Colaboradores", key: "collaborators", width: 55 },
      { header: "Creador", key: "creator", width: 28 },
      { header: "ID del creador", key: "creatorId", width: 38 },
      { header: "Inicio", key: "startsAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
      { header: "Entrega", key: "dueAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
      { header: "Completada", key: "completedAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
      { header: "Creada", key: "createdAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
      { header: "Actualizada", key: "updatedAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
    ],
    data.tasks.map((task) => ({
      id: task.id,
      kind: task.parentId ? "Subtarea" : "Tarea",
      parentTitle: task.parent?.title ?? "",
      parentId: task.parentId ?? "",
      area: task.workspace.area.name,
      areaId: task.workspace.area.id,
      workspace: task.workspace.name,
      workspaceId: task.workspaceId,
      title: task.title,
      description: task.description ?? "",
      status: statusLabels[task.status],
      priority: priorityLabels[task.priority],
      blocked: task.isBlocked ? "Sí" : "No",
      blockedReason: task.blockedReason ?? "",
      responsibles: task.participants
        .filter((participant) => participant.role === "RESPONSIBLE")
        .map((participant) => `${participant.name} (${participant.id})`)
        .join("; "),
      collaborators: task.participants
        .filter((participant) => participant.role === "COLLABORATOR")
        .map(
          (participant) =>
            `${participant.name} (${participant.id})`,
        )
        .join("; "),
      creator: task.createdBy.name,
      creatorId: task.createdById,
      startsAt: formatDate(task.startsAt),
      dueAt: new Date(task.dueAt),
      completedAt: formatDate(task.completedAt),
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
    })),
  );

  addRows(
    workbook,
    "Comentarios",
    [
      { header: "ID del comentario", key: "id", width: 38 },
      { header: "ID de la tarea", key: "taskId", width: 38 },
      { header: "Tarea", key: "task", width: 42 },
      { header: "Autor", key: "author", width: 28 },
      { header: "Comentario", key: "content", width: 72 },
      { header: "Fecha", key: "createdAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
    ],
    data.tasks.flatMap((task) =>
      task.comments.map((comment) => ({
        id: comment.id,
        taskId: task.id,
        task: task.title,
        author: comment.authorName,
        content: comment.content,
        createdAt: new Date(comment.createdAt),
      })),
    ),
  );

  addRows(
    workbook,
    "Historial",
    [
      { header: "ID del registro", key: "id", width: 38 },
      { header: "ID de la tarea", key: "taskId", width: 38 },
      { header: "Tarea", key: "task", width: 42 },
      { header: "Acción", key: "action", width: 24 },
      { header: "Actor", key: "actor", width: 28 },
      { header: "Cambios", key: "changes", width: 72 },
      { header: "Versión de esquema", key: "schemaVersion", width: 20 },
      { header: "Fecha", key: "createdAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
    ],
    data.tasks.flatMap((task) =>
      task.history.map((entry) => ({
        id: entry.id,
        taskId: task.id,
        task: task.title,
        action: entry.action,
        actor: entry.actorName,
        changes: JSON.stringify(entry.changes) ?? "",
        schemaVersion: entry.schemaVersion,
        createdAt: new Date(entry.createdAt),
      })),
    ),
  );

  addRows(
    workbook,
    "Archivos",
    [
      { header: "ID del archivo", key: "id", width: 38 },
      { header: "ID de la tarea", key: "taskId", width: 38 },
      { header: "Tarea", key: "task", width: 42 },
      { header: "Nombre del archivo", key: "name", width: 48 },
      { header: "Tipo de contenido", key: "contentType", width: 32 },
      { header: "Tamaño (bytes)", key: "sizeBytes", width: 18 },
      { header: "Subido por", key: "uploadedBy", width: 28 },
      { header: "Fecha", key: "createdAt", width: 22, style: { numFmt: "yyyy-mm-dd hh:mm" } },
    ],
    data.tasks.flatMap((task) =>
      task.attachments.map((attachment) => ({
        id: attachment.id,
        taskId: task.id,
        task: task.title,
        name: attachment.originalName,
        contentType: attachment.contentType,
        sizeBytes: attachment.sizeBytes,
        uploadedBy: attachment.uploadedByName,
        createdAt: new Date(attachment.createdAt),
      })),
    ),
  );

  return workbook;
}

async function downloadWorkbook(
  workbook: ExcelJS.Workbook,
  filename: string,
) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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

function SummaryCard({
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

function DistributionCard({
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

function DueDistributionCard({ items }: { items: ChartItem[] }) {
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

function ReportTypeButton({
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

function FilterSelect({
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

function TableHeading({ children }: { children: string }) {
  return (
    <th className="whitespace-nowrap px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </th>
  );
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-flex whitespace-nowrap rounded-md bg-surface-muted px-2 py-1 text-[10px] font-semibold text-foreground">
      {children}
    </span>
  );
}

function PriorityPill({ priority }: { priority: TaskPriority }) {
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
