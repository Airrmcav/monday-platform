import { redirect } from "next/navigation";
import { CalendarClock } from "lucide-react";

import { getCurrentProfile } from "@/features/auth/services/auth.service";
import { createMeetingAction } from "@/features/meetings/actions/meeting-actions";
import MeetingForm from "@/features/meetings/components/meeting-form";
import MeetingsCalendar from "@/features/meetings/components/meetings-calendar";
import { getMeetingData } from "@/features/meetings/meetings.service";
import { DashboardNotice } from "@/features/dashboard/components/dashboard-ui";

const meetingTimeZone = "America/Mexico_City";

function getTodayDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: meetingTimeZone,
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [meetingResult, profile, query] = await Promise.all([
    getMeetingData(),
    getCurrentProfile(),
    searchParams,
  ]);

  if (
    meetingResult.status === "unauthenticated" ||
    profile.status === "unauthenticated"
  ) {
    redirect("/login");
  }

  if (meetingResult.status !== "success") {
    return (
      <DashboardNotice
        title="No pudimos cargar las reuniones"
        message="Intenta recargar la página en unos momentos."
      />
    );
  }

  if (profile.status !== "authenticated") {
    return (
      <DashboardNotice
        title="No pudimos verificar tu acceso"
        message="Intenta recargar la página en unos momentos."
      />
    );
  }

  const errorMessage = getMeetingErrorMessage(query.error);
  const participants = meetingResult.participants.filter(
    (participant) => participant.id !== profile.user.id,
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            <CalendarClock aria-hidden="true" size={16} />
            Calendario del equipo
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Reuniones
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            Programa reuniones, invita al equipo y consulta tus invitaciones.
          </p>
        </div>
      </header>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
        >
          {errorMessage}
        </p>
      )}

      <details className="rounded-xl border border-border/70 bg-surface p-4 shadow-sm sm:p-5">
        <summary className="cursor-pointer text-sm font-semibold">
          Programar una reunión
        </summary>
        <div className="mt-4 max-w-3xl border-t border-border/60 pt-4">
          <MeetingForm
            action={createMeetingAction}
            participants={participants}
          />
        </div>
      </details>

      <MeetingsCalendar
        meetings={meetingResult.meetings}
        participants={participants}
        viewerId={profile.user.id}
        initialToday={getTodayDateKey()}
      />
    </div>
  );
}

function getMeetingErrorMessage(error?: string) {
  switch (error) {
    case "cancel-forbidden":
      return "Solo quien organizó la reunión puede cancelarla.";
    case "cancel-not-found":
      return "No encontramos la reunión que intentaste cancelar.";
    case "delete-forbidden":
      return "Solo quien organizó la reunión puede eliminarla.";
    case "delete-not-found":
      return "La reunión ya no existe o ya fue eliminada.";
    case "delete-invalid":
      return "Solo se pueden eliminar reuniones canceladas.";
    case "response-forbidden":
      return "No puedes responder a esta invitación.";
    case "response-not-found":
      return "No encontramos la invitación.";
    case "response-invalid":
      return "No se pudo guardar tu respuesta. Intenta nuevamente.";
    default:
      return error
        ? "No pudimos completar la acción. Recarga las reuniones e inténtalo nuevamente."
        : null;
  }
}
