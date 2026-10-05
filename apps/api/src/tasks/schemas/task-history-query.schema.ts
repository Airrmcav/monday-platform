import { z } from 'zod';

export const taskHistoryQuerySchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type TaskHistoryQuery = z.infer<typeof taskHistoryQuerySchema>;
