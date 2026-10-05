import { z } from "zod";

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  name: z.string(),
  avatarUrl: z.string().url().nullable(),
  status: z.literal("ACTIVE"),
  isAdmin: z.boolean(),
});

export type Profile = z.infer<typeof profileSchema>;
