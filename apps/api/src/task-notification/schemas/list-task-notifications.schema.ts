import { z } from 'zod';

export const listTaskNotificationsSchema = z.strictObject({
  page: z.coerce.number().int().min(1).max(100_000).default(1),

  pageSize: z.coerce.number().int().min(1).max(50).default(20),

  unreadOnly: z.preprocess((value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  }, z.boolean().default(false)),
});

export type ListTaskNotificationsInput = z.infer<
  typeof listTaskNotificationsSchema
>;
