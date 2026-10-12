import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  createMeetingSchema,
  meetingParticipantsSchema,
  meetingsSchema,
  meetingSchema,
  type CreateMeetingInput,
} from "./schemas/meetings.schema";

export type MeetingDataResult =
  | {
      status: "success";
      meetings: Awaited<ReturnType<typeof meetingsSchema.parse>>;
      participants: Awaited<ReturnType<typeof meetingParticipantsSchema.parse>>;
    }
  | { status: "unauthenticated" }
  | { status: "unavailable" };

export type MeetingMutationResult =
  | { status: "success" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "not-found" }
  | { status: "invalid"; message?: string }
  | { status: "unavailable" };

type ApiResult =
  | { status: "success"; payload: unknown }
  | { status: "unauthenticated" | "forbidden" | "not-found" | "unavailable" }
  | { status: "invalid"; message?: string };

async function getApiErrorMessage(response: Response) {
  try {
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("message" in payload)) {
      return undefined;
    }

    const { message } = payload;
    if (typeof message === "string") {
      return message.slice(0, 500);
    }
    if (
      Array.isArray(message) &&
      message.every((item) => typeof item === "string")
    ) {
      return message.join(" ").slice(0, 500);
    }
  } catch {
    return undefined;
  }
  return undefined;
}

async function requestApi(
  path: string,
  init?: RequestInit,
): Promise<ApiResult> {
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
    response = await fetch(`${apiUrl.replace(/\/+$/, "")}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${session.access_token}`,
        ...init?.headers,
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    console.error("[meetings] Falló la petición al API:", {
      path,
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
    return { status: "unavailable" };
  }

  if (response.status === 401) return { status: "unauthenticated" };
  if (response.status === 403) return { status: "forbidden" };
  if (response.status === 404) return { status: "not-found" };
  if (response.status === 400 || response.status === 409) {
    const message = await getApiErrorMessage(response);
    console.error("[meetings] El API rechazó la operación:", {
      path,
      status: response.status,
      message,
    });
    return { status: "invalid", message };
  }
  if (!response.ok) {
    const message = await getApiErrorMessage(response);
    console.error("[meetings] El API devolvió un error:", {
      path,
      status: response.status,
      message,
    });
    return { status: "unavailable" };
  }

  try {
    return { status: "success", payload: await response.json() };
  } catch {
    return { status: "unavailable" };
  }
}

export async function getMeetingData(): Promise<MeetingDataResult> {
  const [meetingResult, participantsResult] = await Promise.all([
    requestApi("/meetings"),
    requestApi("/meetings/participants"),
  ]);

  if (
    meetingResult.status === "unauthenticated" ||
    participantsResult.status === "unauthenticated"
  ) {
    return { status: "unauthenticated" };
  }

  if (
    meetingResult.status !== "success" ||
    participantsResult.status !== "success"
  ) {
    console.error("[meetings] No se pudieron cargar los datos:", {
      meetings: meetingResult.status,
      participants: participantsResult.status,
    });
    return { status: "unavailable" };
  }

  const meetings = meetingsSchema.safeParse(meetingResult.payload);
  const participants = meetingParticipantsSchema.safeParse(
    participantsResult.payload,
  );

  if (!meetings.success || !participants.success) {
    console.error("[meetings] La respuesta del API no cumple el esquema:", {
      meetings: meetings.success
        ? undefined
        : meetings.error.issues.map(({ path, message }) => ({ path, message })),
      participants: participants.success
        ? undefined
        : participants.error.issues.map(({ path, message }) => ({
            path,
            message,
          })),
    });
    return { status: "unavailable" };
  }

  return {
    status: "success",
    meetings: meetings.data,
    participants: participants.data,
  };
}

export async function createMeeting(
  input: CreateMeetingInput,
): Promise<MeetingMutationResult> {
  const validation = createMeetingSchema.safeParse(input);

  if (!validation.success) {
    console.error("[meetings] Entrada inválida al crear reunión:", {
      issues: validation.error.issues.map(({ path, message }) => ({
        path,
        message,
      })),
    });
    return { status: "invalid" };
  }

  const result = await requestApi("/meetings", {
    method: "POST",
    body: JSON.stringify({
      ...validation.data,
      description: validation.data.description || null,
      location: validation.data.location || null,
      meetingUrl: validation.data.meetingUrl || null,
    }),
  });

  if (result.status !== "success") {
    return result;
  }

  const meeting = meetingSchema.safeParse(result.payload);
  if (!meeting.success) {
    console.error("[meetings] Respuesta de creación no válida:", {
      issues: meeting.error.issues.map(({ path, message }) => ({
        path,
        message,
      })),
    });
    return { status: "unavailable" };
  }
  return { status: "success" };
}

export async function updateMeeting(
  meetingId: string,
  input: CreateMeetingInput,
): Promise<MeetingMutationResult> {
  const validation = createMeetingSchema.safeParse(input);

  if (!validation.success) {
    console.error("[meetings] Entrada inválida al actualizar reunión:", {
      issues: validation.error.issues.map(({ path, message }) => ({
        path,
        message,
      })),
    });
    return { status: "invalid" };
  }

  const result = await requestApi(
    `/meetings/${encodeURIComponent(meetingId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ...validation.data,
        description: validation.data.description || null,
        location: validation.data.location || null,
        meetingUrl: validation.data.meetingUrl || null,
      }),
    },
  );

  if (result.status !== "success") {
    return result;
  }

  const meeting = meetingSchema.safeParse(result.payload);
  if (!meeting.success) {
    console.error("[meetings] Respuesta de actualización no válida:", {
      issues: meeting.error.issues.map(({ path, message }) => ({
        path,
        message,
      })),
    });
    return { status: "unavailable" };
  }
  return { status: "success" };
}

async function meetingCommand(
  meetingId: string,
  command: "cancel" | "response",
  body?: { status: "ACCEPTED" | "DECLINED" },
): Promise<MeetingMutationResult> {
  const result = await requestApi(
    `/meetings/${encodeURIComponent(meetingId)}/${command}`,
    {
      method: "PATCH",
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );

  return result.status === "success" ? { status: "success" } : result;
}

export function cancelMeeting(meetingId: string) {
  return meetingCommand(meetingId, "cancel");
}

export async function deleteMeeting(meetingId: string) {
  const result = await requestApi(
    `/meetings/${encodeURIComponent(meetingId)}`,
    { method: "DELETE" },
  );

  return result.status === "success" ? { status: "success" as const } : result;
}

export function respondToMeeting(
  meetingId: string,
  status: "ACCEPTED" | "DECLINED",
) {
  return meetingCommand(meetingId, "response", { status });
}
