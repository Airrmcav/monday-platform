import type { ReportsData } from "../schemas/reports.schema";

export type ReportKind = "areas" | "tasks";
export type TaskStatus = ReportsData["tasks"][number]["status"];
export type TaskPriority = ReportsData["tasks"][number]["priority"];

export type ReportFilters = {
  search: string;
  areaId: string;
  workspaceId: string;
  status: "ALL" | TaskStatus;
  priority: "ALL" | TaskPriority;
  from: string;
  to: string;
  blocked: "ALL" | "yes" | "no";
};

export type ChartItem = {
  label: string;
  value: number;
  color: string;
};

export const initialFilters: ReportFilters = {
  search: "",
  areaId: "ALL",
  workspaceId: "ALL",
  status: "ALL",
  priority: "ALL",
  from: "",
  to: "",
  blocked: "ALL",
};

export const statusLabels = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En progreso",
  IN_REVIEW: "En revisión",
  COMPLETED: "Completada",
} as const;

export const priorityLabels = {
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

export const statusLabelsForFilter = {
  ALL: "Todos los estados",
  ...statusLabels,
} as const;

export const priorityLabelsForFilter = {
  ALL: "Todas las prioridades",
  ...priorityLabels,
} as const;

export const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "America/Mexico_City",
});

export function formatDate(value: string | null) {
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

export function filterReportData(data: ReportsData, filters: ReportFilters) {
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

export function getTaskAnalytics(data: ReportsData) {
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
