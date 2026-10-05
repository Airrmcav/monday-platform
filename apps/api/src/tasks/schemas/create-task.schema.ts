import { z } from 'zod';

export const taskPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'], {
  error: 'Selecciona una prioridad válida.',
});

const participantIdsSchema = z
  .array(z.uuid({ error: 'El identificador del usuario no es válido.' }))
  .max(100, 'Puedes seleccionar hasta 100 usuarios por grupo.')
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'No puedes seleccionar al mismo usuario más de una vez.',
  });

export const createTaskSchema = z
  .strictObject({
    workspaceId: z.uuid({
      error: 'Selecciona un espacio válido.',
    }),

    parentId: z
      .uuid({
        error: 'Selecciona una tarea principal válida.',
      })
      .optional(),

    title: z
      .string({ error: 'El título es obligatorio.' })
      .trim()
      .min(3, 'El título debe tener al menos 3 caracteres.')
      .max(200, 'El título no puede superar los 200 caracteres.'),

    description: z
      .string()
      .trim()
      .max(5000, 'La descripción no puede superar los 5000 caracteres.')
      .transform((value) => value || null)
      .optional(),

    priority: taskPrioritySchema.default('NORMAL'),

    dueAt: z.iso.datetime({
      offset: true,
      error: 'La fecha de entrega debe incluir hora y zona horaria.',
    }),

    responsibleIds: participantIdsSchema.refine((ids) => ids.length > 0, {
      message: 'Selecciona al menos un responsable.',
    }),

    collaboratorIds: participantIdsSchema.default([]),
  })
  .superRefine((data, context) => {
    const responsibleIds = new Set(data.responsibleIds);

    if (data.collaboratorIds.some((id) => responsibleIds.has(id))) {
      context.addIssue({
        code: 'custom',
        path: ['collaboratorIds'],
        message:
          'Un usuario no puede ser responsable y colaborador de la misma tarea.',
      });
    }
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
