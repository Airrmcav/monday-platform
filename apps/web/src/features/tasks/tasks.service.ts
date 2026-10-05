import "server-only";
import {
  CreateTaskInput,
  createTaskSchema,
  Task,
  taskSchema,
  tasksResponseSchema,
  TasksResponse,
  TaskDetail,
  taskDetailSchema,
  UpdateTaskStatusResponse,
  updateTaskStatusSchema,
  updateTaskStatusResponseSchema,
  UpdateTaskStatusInput,
  UpdateTaskBlockResponse,
  updateTaskBlockResponseSchema,
  updateTaskBlockSchema,
  UpdateTaskBlockInput,
  updateTaskResponseSchema,
  updateTaskSchema,
  UpdateTaskInput,
  UpdateTaskResponse,
} from "./schemas/tasks.schema";
import { createClient } from "@/lib/supabase/server";
import {
  TaskHistoryResponse,
  taskHistoryResponseSchema,
} from "./schemas/task-history.schema";
import {
  CreateTaskAttachmentUploadIntentsInput,
  createTaskAttachmentUploadIntentsSchema,
  CreateTaskCommentInput,
  createTaskCommentSchema,
  TaskAttachmentUploadIntentsResponse,
  taskAttachmentUploadIntentsResponseSchema,
  TaskComment,
  taskCommentSchema,
  TaskCommentsResponse,
  taskCommentsResponseSchema,
} from "./schemas/task-comments.schema";

export type CreateTaskResult =
  | { status: "success"; task: Task }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "invalid" }
  | { status: "unavailable" };

export async function createTask(
  input: CreateTaskInput,
): Promise<CreateTaskResult> {
  const validation = createTaskSchema.safeParse(input);

  if (!validation.success) {
    return { status: "invalid" };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(`${apiUrl.replace(/\/+$/, "")}/tasks`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(validation.data),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    console.error("[createTask] Falló la petición:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Error desconocido",
    });

    return { status: "unavailable" };
  }

  if (!response.ok) {
    console.error("[createTask] Respuesta de NestJS:", {
      status: response.status,
      detail: await response
        .clone()
        .text()
        .catch(() => "Sin detalle"),
    });
  }

  switch (response.status) {
    case 400:
      return { status: "invalid" };

    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 201) {
    console.error("[createTask] Se esperaba HTTP 201.");
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    console.error("[createTask] La respuesta no contiene JSON válido.");
    return { status: "unavailable" };
  }

  const taskValidation = taskSchema.safeParse(payload);

  if (!taskValidation.success) {
    console.error(
      "[createTask] Respuesta incompatible:",
      taskValidation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );

    return { status: "unavailable" };
  }

  return {
    status: "success",
    task: taskValidation.data,
  };
}

export type GetTasksResult =
  | { status: "success"; result: TasksResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

export async function getTasks(workspaceId: string): Promise<GetTasksResult> {
  const validation = taskSchema.shape.workspaceId.safeParse(workspaceId);
  if (!validation.success) {
    return { status: "not-found" };
  }

  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("Falta Configurar API_URL");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  const query = new URLSearchParams({
    workspaceId: validation.data,
  });

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks?${query.toString()}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    console.error("[getTasks] Falló la conexión con NestJS.");
    return { status: "unavailable" };
  }

  console.info("[getTasks] HTTP:", response.status);

  if (!response.ok) {
    console.info(
      "[getTasks] Respuesta de error:",
      await response.clone().text(),
    );
  }

  switch (response.status) {
    case 400:
    case 404:
      return { status: "not-found" };

    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };
  }

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    console.error("[getTasks] La respuesta no contiene JSON válido.");
    return { status: "unavailable" };
  }

  const taskValidation = tasksResponseSchema.safeParse(payload);

  if (!taskValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    result: taskValidation.data,
  };
}

export type GetTaskResult =
  | { status: "success"; task: TaskDetail }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

export async function getTask(id: string): Promise<GetTaskResult> {
  const validation = taskSchema.shape.id.safeParse(id);

  if (!validation.success) {
    return { status: "not-found" };
  }
  const apiUrl = process.env.API_URL;
  if (!apiUrl) {
    throw new Error("Falta configurar API_URL");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${validation.data}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  switch (response.status) {
    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const taskValidation = taskDetailSchema.safeParse(payload);

  if (!taskValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    task: taskValidation.data,
  };
}

export type UpdateStatusTaskResult =
  | { status: "success"; task: UpdateTaskStatusResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "invalid" }
  | { status: "unavailable" };

export async function updateStatusTask(
  id: string,
  input: UpdateTaskStatusInput,
): Promise<UpdateStatusTaskResult> {
  const idValidation = taskSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return { status: "not-found" };
  }

  const inputValidation = updateTaskStatusSchema.safeParse(input);

  if (!inputValidation.success) {
    return { status: "invalid" };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${idValidation.data}/status`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(inputValidation.data),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  switch (response.status) {
    case 400:
      return { status: "invalid" };

    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const taskValidation = updateTaskStatusResponseSchema.safeParse(payload);

  if (!taskValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    task: taskValidation.data,
  };
}

export type UpdateTaskBlockResult =
  | { status: "success"; task: UpdateTaskBlockResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "invalid" }
  | { status: "unavailable" };

export async function updateBlockTask(
  id: string,
  input: UpdateTaskBlockInput,
): Promise<UpdateTaskBlockResult> {
  const idValidation = taskSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return { status: "not-found" };
  }

  const inputValidation = updateTaskBlockSchema.safeParse(input);

  if (!inputValidation.success) {
    return { status: "invalid" };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${idValidation.data}/block`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(inputValidation.data),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  switch (response.status) {
    case 400:
      return { status: "invalid" };

    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const taskValidation = updateTaskBlockResponseSchema.safeParse(payload);

  if (!taskValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    task: taskValidation.data,
  };
}

export type UpdateTaskResult =
  | { status: "success"; task: UpdateTaskResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "invalid" }
  | { status: "unavailable" };

export async function updateTask(
  id: string,
  input: UpdateTaskInput,
): Promise<UpdateTaskResult> {
  const idValidation = taskSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return { status: "not-found" };
  }

  const inputValidation = updateTaskSchema.safeParse(input);

  if (!inputValidation.success) {
    return { status: "invalid" };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${idValidation.data}`,
      {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(inputValidation.data),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  switch (response.status) {
    case 400:
      return { status: "invalid" };

    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const taskValidation = updateTaskResponseSchema.safeParse(payload);

  if (!taskValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    task: taskValidation.data,
  };
}

export type GetTaskHistoryResult =
  | { status: "success"; result: TaskHistoryResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

type GetTaskHistoryOptions = {
  page?: number;
  pageSize?: number;
};

export async function getTaskHistory(
  id: string,
  { page = 1, pageSize = 20 }: GetTaskHistoryOptions = {},
): Promise<GetTaskHistoryResult> {
  const idValidation = taskSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return { status: "not-found" };
  }

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 1_000_000 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50
  ) {
    throw new Error("Parámetros de paginación inválidos.");
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  const searchParams = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${idValidation.data}/history?${searchParams.toString()}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  switch (response.status) {
    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const validation = taskHistoryResponseSchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    result: validation.data,
  };
}

export async function getSubtask(parentId: string): Promise<GetTasksResult> {
  const idValidation = taskSchema.shape.id.safeParse(parentId);

  if (!idValidation.success) {
    return {
      status: "not-found",
    };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${idValidation.data}/subtasks`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  switch (response.status) {
    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const validation = tasksResponseSchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    result: validation.data,
  };
}

export type GetTaskCommentsResult =
  | { status: "success"; result: TaskCommentsResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

type GetTaskCommentOptions = {
  page?: number;
  pageSize?: number;
};

export async function getTaskComments(
  taskId: string,
  { page = 1, pageSize = 20 }: GetTaskCommentOptions = {},
): Promise<GetTaskCommentsResult> {
  const taskIdValidation = taskSchema.shape.id.safeParse(taskId);

  if (
    !taskIdValidation.success ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 50 ||
    !Number.isSafeInteger((page - 1) * pageSize)
  ) {
    return { status: "not-found" };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${taskIdValidation.data}/comments?${query}`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }
  switch (response.status) {
    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 200) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return {
      status: "unavailable",
    };
  }

  const validation = taskCommentsResponseSchema.safeParse(payload);

  if (!validation.success) {
    return {
      status: "unavailable",
    };
  }

  return {
    status: "success",
    result: validation.data,
  };
}

export type CreateTaskCommentResult =
  | { status: "success"; comment: TaskComment }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "invalid" }
  | { status: "unavailable" };

export async function createTaskComment(
  taskId: string,
  input: CreateTaskCommentInput,
): Promise<CreateTaskCommentResult> {
  const taskIdValidation = taskSchema.shape.id.safeParse(taskId);
  const inputValidation = createTaskCommentSchema.safeParse(input);

  if (!taskIdValidation.success) {
    return { status: "not-found" };
  }

  if (!inputValidation.success) {
    return { status: "invalid" };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return {
      status: "unauthenticated",
    };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${taskIdValidation.data}/comments`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(inputValidation.data),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    return {
      status: "unavailable",
    };
  }

  switch (response.status) {
    case 400:
      return { status: "invalid" };

    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 201) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return {
      status: "unavailable",
    };
  }

  const validation = taskCommentSchema.safeParse(payload);

  if (!validation.success) {
    return {
      status: "unavailable",
    };
  }

  return {
    status: "success",
    comment: validation.data,
  };
}

export type CreateTaskAttachmentUploadIntentsResult =
  | {
      status: "success";
      result: TaskAttachmentUploadIntentsResponse;
    }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "invalid" }
  | { status: "unavailable" };

export async function createTaskAttachmentUploadIntents(
  taskId: string,
  input: CreateTaskAttachmentUploadIntentsInput,
): Promise<CreateTaskAttachmentUploadIntentsResult> {
  const taskIdValidation = taskSchema.shape.id.safeParse(taskId);
  const inputValidation =
    createTaskAttachmentUploadIntentsSchema.safeParse(input);

  if (!taskIdValidation.success) {
    return { status: "not-found" };
  }

  if (!inputValidation.success) {
    return { status: "invalid" };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${taskIdValidation.data}/attachments/upload-intents`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(inputValidation.data),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  switch (response.status) {
    case 400:
      return { status: "invalid" };

    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 201) {
    return { status: "unavailable" };
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return { status: "unavailable" };
  }

  const validation =
    taskAttachmentUploadIntentsResponseSchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    result: validation.data,
  };
}

export type GetTaskAttachmentDownloadUrlResult =
  | {
      status: "success";
      url: string;
    }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

export async function getTaskAttachmentDownloadUrl(
  taskId: string,
  attachmentId: string,
): Promise<GetTaskAttachmentDownloadUrlResult> {
  const taskIdValidation = taskSchema.shape.id.safeParse(taskId);
  const attachmentIdValidation = taskSchema.shape.id.safeParse(attachmentId);

  if (!taskIdValidation.success || !attachmentIdValidation.success) {
    return { status: "not-found" };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${taskIdValidation.data}/attachments/${attachmentIdValidation.data}/download`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  switch (response.status) {
    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (response.status !== 302) {
    return { status: "unavailable" };
  }

  const url = response.headers.get("location");

  if (!url) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    url,
  };
}

export type CancelTaskAttachmentUploadResult =
  | { status: "success" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

export async function cancelTaskAttachmentUpload(
  taskId: string,
  attachmentId: string,
): Promise<CancelTaskAttachmentUploadResult> {
  const taskIdValidation = taskSchema.shape.id.safeParse(taskId);
  const attachmentIdValidation = taskSchema.shape.id.safeParse(attachmentId);

  if (!taskIdValidation.success || !attachmentIdValidation.success) {
    return { status: "not-found" };
  }

  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    throw new Error("Falta configurar API_URL.");
  }

  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return { status: "unauthenticated" };
  }

  let response: Response;

  try {
    response = await fetch(
      `${apiUrl.replace(/\/+$/, "")}/tasks/${taskIdValidation.data}/attachments/${attachmentIdValidation.data}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15_000),
      },
    );
  } catch {
    return { status: "unavailable" };
  }

  switch (response.status) {
    case 401:
      return { status: "unauthenticated" };

    case 403:
      return { status: "forbidden" };

    case 404:
      return { status: "not-found" };
  }

  if (!response.ok) {
    return { status: "unavailable" };
  }

  return { status: "success" };
}
