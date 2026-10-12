"use server";

import { fromZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  cancelMeeting,
  createMeeting,
  deleteMeeting,
  respondToMeeting,
  updateMeeting,
} from "../meetings.service";
import {
  createMeetingSchema,
  type CreateMeetingInput,
} from "../schemas/meetings.schema";

const meetingTimeZone = "America/Mexico_City";

export type MeetingFormState = {
  error: string;
  fieldErrors?: Partial<Record<keyof CreateMeetingInput, string[]>>;
};

function getFormInput(formData: FormData) {
  const localStartsAt = String(formData.get("startsAt") ?? "");
  const localEndsAt = String(formData.get("endsAt") ?? "");
  const startsAt = fromZonedTime(localStartsAt, meetingTimeZone);
  const endsAt = fromZonedTime(localEndsAt, meetingTimeZone);

  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    startsAt: Number.isNaN(startsAt.getTime()) ? "" : startsAt.toISOString(),
    endsAt: Number.isNaN(endsAt.getTime()) ? "" : endsAt.toISOString(),
    timeZone: meetingTimeZone,
    location: String(formData.get("location") ?? ""),
    meetingUrl: String(formData.get("meetingUrl") ?? ""),
    participantIds: formData.getAll("participantIds").map(String),
  };
}

function getFieldErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): MeetingFormState["fieldErrors"] {
  const errors: NonNullable<MeetingFormState["fieldErrors"]> = {};

  for (const issue of issues) {
    const field = issue.path[0];
    if (
      field === "title" ||
      field === "description" ||
      field === "startsAt" ||
      field === "endsAt" ||
      field === "timeZone" ||
      field === "location" ||
      field === "meetingUrl" ||
      field === "participantIds"
    ) {
      errors[field] ??= [];
      errors[field]!.push(issue.message);
    }
  }

  return errors;
}

export async function createMeetingAction(
  _previousState: MeetingFormState,
  formData: FormData,
): Promise<MeetingFormState> {
  const validation = createMeetingSchema.safeParse(getFormInput(formData));

  if (!validation.success) {
    return {
      error: "Revisa los datos de la reunión.",
      fieldErrors: getFieldErrors(validation.error.issues),
    };
  }

  const result = await createMeeting(validation.data);

  if (result.status === "unauthenticated") redirect("/login");
  if (result.status === "forbidden") {
    return { error: "No tienes permiso para crear reuniones." };
  }
  if (result.status === "invalid") {
    return {
      error:
        result.message ??
        "Revisa la fecha, el enlace y los participantes seleccionados.",
    };
  }
  if (result.status !== "success") {
    return {
      error:
        "No pudimos confirmar la creación. Revisa la lista de reuniones antes de volver a intentarlo.",
    };
  }

  revalidatePath("/meetings");
  redirect("/meetings");
}

export async function updateMeetingAction(
  meetingId: string,
  _previousState: MeetingFormState,
  formData: FormData,
): Promise<MeetingFormState> {
  const validation = createMeetingSchema.safeParse(getFormInput(formData));

  if (!validation.success) {
    return {
      error: "Revisa los datos de la reunión.",
      fieldErrors: getFieldErrors(validation.error.issues),
    };
  }

  const result = await updateMeeting(meetingId, validation.data);

  if (result.status === "unauthenticated") redirect("/login");
  if (result.status === "forbidden") {
    return { error: "Solo quien organizó la reunión puede modificarla." };
  }
  if (result.status === "not-found") {
    return { error: "No encontramos la reunión." };
  }
  if (result.status === "invalid") {
    return {
      error:
        result.message ??
        "Revisa la fecha, el enlace y los participantes seleccionados.",
    };
  }
  if (result.status !== "success") {
    return { error: "No pudimos actualizar la reunión. Intenta nuevamente." };
  }

  revalidatePath("/meetings");
  redirect("/meetings");
}

export async function cancelMeetingAction(meetingId: string) {
  const result = await cancelMeeting(meetingId);

  if (result.status === "unauthenticated") redirect("/login");
  if (result.status !== "success") {
    redirect(`/meetings?error=cancel-${result.status}`);
  }

  revalidatePath("/meetings");
  redirect("/meetings");
}

export async function deleteMeetingAction(meetingId: string) {
  const result = await deleteMeeting(meetingId);

  if (result.status === "unauthenticated") redirect("/login");
  if (result.status !== "success") {
    redirect(`/meetings?error=delete-${result.status}`);
  }

  revalidatePath("/meetings");
  redirect("/meetings");
}

export async function respondToMeetingAction(
  meetingId: string,
  status: "ACCEPTED" | "DECLINED",
) {
  const result = await respondToMeeting(meetingId, status);

  if (result.status === "unauthenticated") redirect("/login");
  if (result.status !== "success") {
    redirect(`/meetings?error=response-${result.status}`);
  }

  revalidatePath("/meetings");
  redirect("/meetings");
}

export async function respondToMeetingFormAction(
  meetingId: string,
  formData: FormData,
) {
  const status = formData.get("status");

  if (status !== "ACCEPTED" && status !== "DECLINED") {
    redirect("/meetings?error=response-invalid");
  }

  return respondToMeetingAction(meetingId, status);
}
