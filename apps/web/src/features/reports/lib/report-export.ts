import ExcelJS from "exceljs";

import type { ReportsData } from "../schemas/reports.schema";
import { formatDate, priorityLabels, statusLabels } from "./report-data";

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

export function createAreasWorkbook(data: ReportsData) {
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

export function createTasksWorkbook(data: ReportsData) {
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

export async function downloadWorkbook(
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
