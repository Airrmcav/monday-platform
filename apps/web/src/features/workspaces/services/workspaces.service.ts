import "server-only";

import { createApiClient } from "@/lib/api-client";
import {
  CreateWorkspaceInput,
  createWorkspaceSchema,
  Workspace,
  workspaceSchema,
  workspacesResponseSchema,
  type WorkspacesResponse,
  workspaceMembersResponseSchema,
  type WorkspaceMembersResponse,
  WorkspaceForEdit,
  workspaceForEditSchema,
  updateWorkspaceResponseSchema,
  UpdateWorkspaceResponse,
  UpdateWorkspaceInput,
  updateWorkspaceSchema,
} from "../schemas/workspaces.schemas";

export type GetWorkspacesResult =
  | { status: "success"; result: WorkspacesResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "invalid" }
  | { status: "unavailable" };

export async function getWorkspaces(
  areaId: string,
): Promise<GetWorkspacesResult> {
  const validation = workspaceSchema.shape.areaId.safeParse(areaId);

  if (!validation.success) {
    return { status: "invalid" };
  }

  const api = await createApiClient();
  if (api.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }
  const apiUrl = api.baseUrl;

  const query = new URLSearchParams({
    areaId: validation.data,
  });

  let response: Response;

  try {
    response = await api.request(`${apiUrl}/workspaces?${query.toString()}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
    });
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

  const responseValidation = workspacesResponseSchema.safeParse(payload);

  if (!responseValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    result: responseValidation.data,
  };
}

export type CreateWorkSpaceResult =
  | { status: "success"; workspace: Workspace }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "conflict" }
  | { status: "invalid" }
  | { status: "unavailable" };

export async function createWorkspace(
  input: CreateWorkspaceInput,
): Promise<CreateWorkSpaceResult> {
  const validation = createWorkspaceSchema.safeParse(input);

  if (!validation.success) {
    return { status: "invalid" };
  }

  const api = await createApiClient();
  if (api.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }
  const apiUrl = api.baseUrl;

  let response: Response;

  try {
    response = await api.request(`${apiUrl}/workspaces`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validation.data),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
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

    case 409:
      return { status: "conflict" };
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

  const workspaceValidation = workspaceSchema.safeParse(payload);

  if (!workspaceValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    workspace: workspaceValidation.data,
  };
}

export type GetWorkspaceResult =
  | { status: "success"; workspace: Workspace }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

export async function getWorkspace(id: string): Promise<GetWorkspaceResult> {
  const validation = workspaceSchema.shape.id.safeParse(id);

  if (!validation.success) {
    return { status: "not-found" };
  }

  const api = await createApiClient();
  if (api.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }
  const apiUrl = api.baseUrl;

  let response: Response;

  try {
    response = await api.request(
      `${apiUrl}/workspaces/${encodeURIComponent(validation.data)}`,
      {
        headers: {
          Accept: "application/json",
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
    return { status: "unavailable" };
  }

  const workspaceValidation = workspaceSchema.safeParse(payload);

  if (!workspaceValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    workspace: workspaceValidation.data,
  };
}

export type GetWorkspaceMembersResult =
  | { status: "success"; result: WorkspaceMembersResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

export async function getWorkspaceMembers(
  workspaceId: string,
): Promise<GetWorkspaceMembersResult> {
  const validation = workspaceSchema.shape.id.safeParse(workspaceId);

  if (!validation.success) {
    return { status: "not-found" };
  }

  const api = await createApiClient();
  if (api.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }
  const apiUrl = api.baseUrl;

  let response: Response;

  try {
    response = await api.request(
      `${apiUrl}/workspaces/${encodeURIComponent(validation.data)}/members`,
      {
        headers: {
          Accept: "application/json",
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
    return { status: "unavailable" };
  }

  const membersValidation = workspaceMembersResponseSchema.safeParse(payload);

  if (!membersValidation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    result: membersValidation.data,
  };
}

export type GetWorkspaceForEditResult =
  | { status: "success"; workspace: WorkspaceForEdit }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "unavailable" };

export async function getWorkspaceforEdit(
  id: string,
): Promise<GetWorkspaceForEditResult> {
  const idValidation = workspaceForEditSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return { status: "not-found" };
  }

  const api = await createApiClient();
  if (api.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }
  const apiUrl = api.baseUrl;

  let response: Response;

  try {
    response = await api.request(
      `${apiUrl}/workspaces/${idValidation.data}/edit`,
      {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    return {
      status: "unavailable",
    };
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

  const validation = workspaceForEditSchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    workspace: validation.data,
  };
}

export type UpdateWorkspaceResult =
  | { status: "success"; workspace: UpdateWorkspaceResponse }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "invalid" }
  | { status: "conflict" }
  | { status: "unavailable" };

export async function updateWorkspace(
  id: string,
  input: UpdateWorkspaceInput,
): Promise<UpdateWorkspaceResult> {
  const idValidation = workspaceForEditSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return { status: "not-found" };
  }

  const inputValidation = updateWorkspaceSchema.safeParse(input);

  if (!inputValidation.success) {
    return { status: "invalid" };
  }

  const api = await createApiClient();
  if (api.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }
  const apiUrl = api.baseUrl;

  let response: Response;

  try {
    response = await api.request(`${apiUrl}/workspaces/${idValidation.data}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inputValidation.data),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
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

    case 409:
      return { status: "conflict" };
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

  const validation = updateWorkspaceResponseSchema.safeParse(payload);

  if (!validation.success) {
    return { status: "unavailable" };
  }

  return {
    status: "success",
    workspace: validation.data,
  };
}
