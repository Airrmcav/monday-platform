import { z } from "zod";

export const meetingParticipantSchema = z.strictObject({
  status: z.enum(["INVITED", "ACCEPTED", "DECLINED"]),
  user: z.strictObject({
    id: z.uuid(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
  }),
});

export const meetingSchema = z.strictObject({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  timeZone: z.string(),
  location: z.string().nullable(),
  meetingUrl: z.string().nullable(),
  status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]),
  organizerId: z.uuid(),
  organizer: z.strictObject({
    id: z.uuid(),
    name: z.string(),
    avatarUrl: z.string().nullable(),
  }),
  participants: z.array(meetingParticipantSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const meetingParticipantOptionSchema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  avatarUrl: z.string().nullable(),
});

export const meetingParticipantsSchema = z.array(meetingParticipantOptionSchema);
export const meetingsSchema = z.array(meetingSchema);

export const createMeetingSchema = z
  .strictObject({
    title: z
      .string()
      .trim()
      .min(3, "El título debe tener al menos 3 caracteres.")
      .max(200, "El título no puede superar los 200 caracteres."),
    description: z
      .string()
      .trim()
      .max(5000, "La descripción no puede superar los 5000 caracteres."),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    timeZone: z.string().trim().min(1).max(64),
    location: z.string().trim().max(300, "La ubicación es demasiado larga."),
    meetingUrl: z.union([
      z.literal(""),
      z.url("Ingresa un enlace válido.").refine(
        (value) => value.startsWith("https://"),
        "El enlace debe comenzar con https://.",
      ),
    ]),
    participantIds: z.array(z.uuid()).max(100),
  })
  .refine((value) => new Date(value.endsAt) > new Date(value.startsAt), {
    path: ["endsAt"],
    message: "La hora de fin debe ser posterior a la hora de inicio.",
  })
  .refine(
    (value) => new Set(value.participantIds).size === value.participantIds.length,
    {
      path: ["participantIds"],
      message: "No puedes invitar al mismo usuario más de una vez.",
    },
  );

export type Meeting = z.infer<typeof meetingSchema>;
export type MeetingParticipantOption = z.infer<
  typeof meetingParticipantOptionSchema
>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
