import { z } from 'zod';

export const updateTaskStatusSchema = z.strictObject({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'], {
    error: 'Selecciona un estado válido para la tarea.',
  }),
});

export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
