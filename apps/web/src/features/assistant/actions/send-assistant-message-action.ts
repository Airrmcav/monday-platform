"use server";

import { redirect } from "next/navigation";
import { sendAssistantMessage } from "../assistant.service";
import {
  assistantMessagesSchema,
  type AssistantMessage,
} from "../schemas/assistant-chat.schema";

export type SendAssistantMessageResult =
  | { success: true; text: string }
  | { success: false; error: string };

export async function sendAssistantMessageAction(
  messages: AssistantMessage[],
): Promise<SendAssistantMessageResult> {
  const validation = assistantMessagesSchema.safeParse(messages);
  if (!validation.success) {
    return {
      success: false,
      error: "El mensaje no es válido o la conversación es demasiado larga.",
    };
  }

  const result = await sendAssistantMessage(validation.data);
  switch (result.status) {
    case "unauthenticated":
      redirect("/login");
    case "rate-limited":
      return {
        success: false,
        error: "Has enviado varias consultas. Espera un momento e inténtalo de nuevo.",
      };
    case "unavailable":
      return {
        success: false,
        error: "No pudimos obtener una respuesta. Inténtalo nuevamente.",
      };
    case "success":
      return { success: true, text: result.text };
  }
}
