import { z } from 'zod';

const participantIdsSchema = z
  .array(z.uuid({ error: 'El identificador del usuario no es válido.' }))
  .max(100, 'Puedes invitar hasta 100 participantes.')
  .refine((ids) => new Set(ids).size === ids.length, {
    message: 'No puedes invitar al mismo usuario más de una vez.',
  });

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} no puede superar los ${max} caracteres.`)
    .transform((value) => value || null)
    .nullable()
    .optional();

const urlSchema = z
  .url({ error: 'Ingresa un enlace válido.' })
  .refine((value) => value.startsWith('https://'), {
    message: 'El enlace debe comenzar con https://.',
  })
  .nullable()
  .optional();

const timeZoneSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine((timeZone) => {
    try {
      new Intl.DateTimeFormat('en-US', { timeZone });
      return true;
    } catch {
      return false;
    }
  }, 'La zona horaria no es válida.');

export const createMeetingSchema = z
  .strictObject({
    title: z
      .string()
      .trim()
      .min(3, 'El título debe tener al menos 3 caracteres.')
      .max(200, 'El título no puede superar los 200 caracteres.'),
    description: optionalText(5000, 'La descripción'),
    startsAt: z.iso.datetime({
      offset: true,
      error: 'La fecha de inicio debe incluir hora y zona horaria.',
    }),
    endsAt: z.iso.datetime({
      offset: true,
      error: 'La fecha de fin debe incluir hora y zona horaria.',
    }),
    timeZone: timeZoneSchema,
    location: optionalText(300, 'La ubicación'),
    meetingUrl: urlSchema,
    participantIds: participantIdsSchema.default([]),
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    path: ['endsAt'],
    message: 'La hora de fin debe ser posterior a la hora de inicio.',
  });

export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

export const updateMeetingSchema = z
  .strictObject({
    title: createMeetingSchema.shape.title.optional(),
    description: optionalText(5000, 'La descripción'),
    startsAt: createMeetingSchema.shape.startsAt.optional(),
    endsAt: createMeetingSchema.shape.endsAt.optional(),
    timeZone: createMeetingSchema.shape.timeZone.optional(),
    location: optionalText(300, 'La ubicación'),
    meetingUrl: urlSchema,
    participantIds: participantIdsSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Indica al menos un campo para actualizar.',
  });

export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;

export const meetingResponseSchema = z.strictObject({
  status: z.enum(['ACCEPTED', 'DECLINED']),
});

export type MeetingResponseInput = z.infer<typeof meetingResponseSchema>;
