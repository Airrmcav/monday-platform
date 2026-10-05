import { z } from 'zod';

import { taskPrioritySchema } from './create-task.schema.js';

const participantIdsSchema = z
  .array(
    z.uuid({
      error: 'El identificador del usuario no es válido.',
    }),
  )
  .max(100, 'Puedes seleccionar hasta 100 usuarios por grupo.')
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'No puedes seleccionar al mismo usuario más de una vez.',
  });

export const updateTaskSchema = z
  .strictObject({
    title: z
      .string({ error: 'El título debe ser un texto.' })
      .trim()
      .min(3, 'El título debe tener al menos 3 caracteres.')
      .max(200, 'El título no puede superar los 200 caracteres.')
      .optional(),

    description: z
      .string()
      .trim()
      .max(5000, 'La descripción no puede superar los 5000 caracteres.')
      .transform((value) => value || null)
      .nullable()
      .optional(),

    priority: taskPrioritySchema.optional(),

    dueAt: z.iso
      .datetime({
        offset: true,
        error: 'La fecha de entrega debe incluir hora y zona horaria.',
      })
      .optional(),

    responsibleIds: participantIdsSchema
      .min(1, 'Selecciona al menos un responsable.')
      .optional(),

    collaboratorIds: participantIdsSchema.optional(),
  })
  .superRefine((data, context) => {
    const hasChanges = Object.values(data).some((value) => value !== undefined);

    if (!hasChanges) {
      context.addIssue({
        code: 'custom',
        message: 'Envía al menos un campo para actualizar.',
      });
    }

    if (
      data.responsibleIds !== undefined &&
      data.collaboratorIds !== undefined
    ) {
      const responsibleIds = new Set(data.responsibleIds);

      if (data.collaboratorIds.some((id) => responsibleIds.has(id))) {
        context.addIssue({
          code: 'custom',
          path: ['collaboratorIds'],
          message:
            'Un usuario no puede ser responsable y colaborador de la misma tarea.',
        });
      }
    }
  });

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
