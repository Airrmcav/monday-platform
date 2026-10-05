import { z } from "zod";

export const areaSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  archivedAt: z.iso.datetime({ offset: true }).nullable(),
});

export const areasResponseSchema = z.object({
  data: z.array(areaSchema),
});

export const createAreaSchema = z.strictObject({
  name: z
    .string({ error: "El nombre del área es obligatorio." })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(100, "El nombre no puede superar los 100 caracteres."),
});

export type Area = z.infer<typeof areaSchema>;
export type AreasResponse = z.infer<typeof areasResponseSchema>;
export type CreateAreaInput = z.infer<typeof createAreaSchema>;
