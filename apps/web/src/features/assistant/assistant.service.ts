import "server-only";

import { createApiClient } from "@/lib/api-client";
import {
  assistantMessagesSchema,
  assistantResponseSchema,
  type AssistantMessage,
} from "./schemas/assistant-chat.schema";

export type AssistantChatResult =
  | { status: "success"; text: string }
  | { status: "unauthenticated" }
  | { status: "rate-limited" }
  | { status: "unavailable" };

export async function sendAssistantMessage(
  messages: AssistantMessage[],
): Promise<AssistantChatResult> {
  const validation = assistantMessagesSchema.safeParse(messages);
  if (!validation.success) {
    console.error("[assistant] Entrada de chat no válida:", {
      issues: validation.error.issues.map(({ path, message }) => ({
        path,
        message,
      })),
    });
    return { status: "unavailable" };
  }

  const api = await createApiClient();
  if (api.status === "unauthenticated") {
    return { status: "unauthenticated" };
  }

  let response: Response;
  try {
    response = await api.request(
      "/assistant/chat",
      {
        method: "POST",
        body: JSON.stringify({ messages: validation.data }),
      },
      30_000,
    );
  } catch (error) {
    console.error("[assistant] Falló la petición al API:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : "Error desconocido",
    });
    return { status: "unavailable" };
  }

  if (response.status === 401) return { status: "unauthenticated" };
  if (response.status === 429) return { status: "rate-limited" };
  if (!response.ok) {
    console.error("[assistant] El API devolvió un error:", {
      status: response.status,
    });
    return { status: "unavailable" };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    console.error("[assistant] La respuesta del API no es JSON válido.");
    return { status: "unavailable" };
  }

  const result = assistantResponseSchema.safeParse(payload);
  if (!result.success) {
    console.error("[assistant] La respuesta del API no cumple el esquema:", {
      issues: result.error.issues.map(({ path, message }) => ({
        path,
        message,
      })),
    });
    return { status: "unavailable" };
  }

  return { status: "success", text: result.data.text };
}
