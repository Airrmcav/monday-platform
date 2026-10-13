import { z } from 'zod';

export const assistantChatSchema = z.strictObject({
  messages: z
    .array(
      z.strictObject({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(12_000),
      }),
    )
    .min(1)
    .max(12)
    .refine((messages) => messages.at(-1)?.role === 'user', {
      message: 'El último mensaje debe ser del usuario.',
    })
    .refine(
      (messages) =>
        messages.every(
          (message) =>
            message.role !== 'user' || message.content.length <= 2000,
        ),
      { message: 'Las preguntas no pueden superar los 2000 caracteres.' },
    )
    .refine(
      (messages) =>
        messages.reduce(
          (total, message) => total + message.content.length,
          0,
        ) <= 24_000,
      { message: 'El historial de conversación es demasiado largo.' },
    ),
});

export type AssistantChatInput = z.infer<typeof assistantChatSchema>;
