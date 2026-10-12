"use client";

import { useRef } from "react";
import { formatInTimeZone } from "date-fns-tz";
import {
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  Check,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock3,
  MapPin,
  Pencil,
  Trash2,
  Video,
  X,
} from "lucide-react";

import type {
  Meeting,
  MeetingParticipantOption,
} from "../schemas/meetings.schema";
import {
  cancelMeetingAction,
  deleteMeetingAction,
  respondToMeetingFormAction,
  updateMeetingAction,
} from "../actions/meeting-actions";
import MeetingForm from "./meeting-form";

type ParticipantStatus = Meeting["participants"][number]["status"];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default function MeetingList({
  meetings,
  participants,
  viewerId,
  compact = false,
}: {
  meetings: Meeting[];
  participants: MeetingParticipantOption[];
  viewerId: string;
  compact?: boolean;
}) {
  if (meetings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <CalendarClock
          aria-hidden="true"
          className="mx-auto text-muted-foreground"
          size={28}
        />
        <h2 className="mt-3 text-sm font-semibold">Aún no hay reuniones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Programa una reunión e invita a las personas que deben participar.
        </p>
      </div>
    );
  }

  return (
    <ol className={compact ? "space-y-2.5" : "space-y-4"}>
      {meetings.map((meeting) => {
        const isOrganizer = meeting.organizerId === viewerId;
        const ownParticipation = meeting.participants.find(
          (participant) => participant.user.id === viewerId,
        );
        const startsAt = new Date(meeting.startsAt);
        const endsAt = new Date(meeting.endsAt);
        const canManage = isOrganizer && meeting.status === "SCHEDULED";
        const isCancelled = meeting.status === "CANCELLED";
        const titleId = `meeting-title-${meeting.id}`;

        const timeFormatter = new Intl.DateTimeFormat("es-MX", {
          hour: "numeric",
          minute: "2-digit",
          timeZone: meeting.timeZone,
        });
        const dateFormatter = new Intl.DateTimeFormat("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          timeZone: meeting.timeZone,
        });
        const startsAtValue = formatInTimeZone(
          startsAt,
          meeting.timeZone,
          "yyyy-MM-dd'T'HH:mm",
        );
        const endsAtValue = formatInTimeZone(
          endsAt,
          meeting.timeZone,
          "yyyy-MM-dd'T'HH:mm",
        );

        // Solo presentación: ¿empieza y termina el mismo día?
        const startDateLabel = dateFormatter.format(startsAt);
        const endDateLabel = dateFormatter.format(endsAt);
        const isSameDay = startDateLabel === endDateLabel;
        const durationLabel = formatDuration(
          Math.round((endsAt.getTime() - startsAt.getTime()) / 60000),
        );

        const counts = countResponses(meeting.participants);

        return (
          <li
            key={meeting.id}
            className={`rounded-xl border border-border/70 border-l-4 bg-surface shadow-sm ${getAccentClassName(
              meeting.status,
            )}`}
          >
            <article
              aria-labelledby={titleId}
              className={compact ? "p-3" : "p-4 sm:p-5"}
            >
              {/* Encabezado: qué es y quién la organiza */}
              <header>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <h2
                    id={titleId}
                    className={`${compact ? "text-base" : "text-lg"} font-semibold leading-snug ${
                      isCancelled
                        ? "text-muted-foreground line-through decoration-1"
                        : "text-foreground"
                    }`}
                  >
                    {meeting.title}
                  </h2>
                  <MeetingStatus status={meeting.status} />
                </div>
                <p
                  className={`mt-2 inline-flex items-center gap-2 ${
                    compact ? "text-xs" : "text-sm"
                  } text-muted-foreground`}
                >
                  <MeetingMemberAvatar
                    name={meeting.organizer.name}
                    avatarUrl={meeting.organizer.avatarUrl}
                    className={
                      compact ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]"
                    }
                  />
                  <span>
                    Organizada por{" "}
                    <span className="font-medium text-foreground">
                      {meeting.organizer.name}
                    </span>
                    {isOrganizer && " (tú)"}
                  </span>
                </p>
              </header>

              {/* Horario: lo más importante, con fecha y hora bien separadas */}
              <section
                aria-label="Horario de la reunión"
                className={`${compact ? "mt-3 p-2.5" : "mt-4 p-3 sm:p-4"} rounded-lg border border-border/60 bg-surface-muted/40 ${
                  isCancelled ? "opacity-70" : ""
                }`}
              >
                {isSameDay ? (
                  <div className="flex items-start gap-3">
                    <CalendarDays
                      aria-hidden="true"
                      size={18}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    <div className="min-w-0">
                      <p
                        className={`font-medium capitalize text-foreground ${compact ? "text-xs" : "text-sm"}`}
                      >
                        {startDateLabel}
                      </p>
                      <p
                        className={`mt-1 flex flex-wrap items-baseline gap-x-2 font-bold tabular-nums text-foreground ${compact ? "text-sm" : "text-base"}`}
                      >
                        <span>
                          <time dateTime={startsAt.toISOString()}>
                            {timeFormatter.format(startsAt)}
                          </time>
                          <span aria-hidden="true"> a </span>
                          <span className="sr-only"> hasta </span>
                          <time dateTime={endsAt.toISOString()}>
                            {timeFormatter.format(endsAt)}
                          </time>
                        </span>
                        <span
                          className={`font-medium text-muted-foreground ${compact ? "text-[10px]" : "text-xs"}`}
                        >
                          Duración: {durationLabel}
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <dl
                    className={`grid ${compact ? "gap-2" : "gap-3 sm:grid-cols-2"}`}
                  >
                    <ScheduleEntry
                      icon={<CalendarDays aria-hidden="true" size={16} />}
                      label="Inicio"
                      dateLabel={startDateLabel}
                      timeLabel={timeFormatter.format(startsAt)}
                      isoValue={startsAt.toISOString()}
                      compact={compact}
                    />
                    <ScheduleEntry
                      icon={<Clock3 aria-hidden="true" size={16} />}
                      label="Finalización"
                      dateLabel={endDateLabel}
                      timeLabel={timeFormatter.format(endsAt)}
                      isoValue={endsAt.toISOString()}
                      compact={compact}
                    />
                  </dl>
                )}
                <p
                  className={`text-muted-foreground ${compact ? "mt-1 text-[10px]" : "mt-2 text-xs"}`}
                >
                  Zona horaria: {meeting.timeZone}
                </p>
              </section>

              {meeting.description && (
                <p
                  className={`max-w-prose whitespace-pre-wrap text-foreground/80 ${compact ? "mt-2 text-xs leading-5" : "mt-4 text-sm leading-6"}`}
                >
                  {meeting.description}
                </p>
              )}

              {(meeting.location || meeting.meetingUrl) && (
                <ul
                  className={`flex flex-wrap items-center ${compact ? "mt-2 gap-x-3 gap-y-1 text-xs" : "mt-4 gap-x-5 gap-y-2 text-sm"}`}
                >
                  {meeting.location && (
                    <li className="inline-flex items-center gap-2 text-muted-foreground">
                      <MapPin
                        aria-hidden="true"
                        size={16}
                        className="shrink-0"
                      />
                      <span className="sr-only">Lugar: </span>
                      {meeting.location}
                    </li>
                  )}
                  {meeting.meetingUrl && (
                    <li>
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex min-h-9 items-center gap-2 rounded-md border border-primary/30 px-3 py-1.5 font-medium text-primary hover:bg-primary-soft ${focusRing}`}
                      >
                        <Video aria-hidden="true" size={compact ? 14 : 16} />
                        Abrir reunión
                        <ArrowUpRight
                          aria-hidden="true"
                          size={compact ? 12 : 14}
                        />
                        <span className="sr-only">
                          (se abre en una pestaña nueva)
                        </span>
                      </a>
                    </li>
                  )}
                </ul>
              )}

              {/* Participantes */}
              <section
                aria-label="Participantes"
                className={`${compact ? "mt-3 pt-3" : "mt-5 pt-4"} border-t border-border/60`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3
                    className={`font-semibold ${compact ? "text-xs" : "text-sm"}`}
                  >
                    Participantes ({meeting.participants.length})
                  </h3>
                  {meeting.participants.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {counts.accepted} asistirán · {counts.pending} pendientes
                      · {counts.declined} no asistirán
                    </p>
                  )}
                </div>

                {meeting.participants.length === 0 ? (
                  <p
                    className={`text-muted-foreground ${compact ? "mt-1 text-xs" : "mt-2 text-sm"}`}
                  >
                    No se invitaron participantes.
                  </p>
                ) : (
                  <ul
                    className={`flex flex-wrap ${compact ? "mt-2 gap-1.5" : "mt-3 gap-2"}`}
                  >
                    {meeting.participants.map(({ user, status }) => (
                      <li
                        key={user.id}
                        className={`inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-surface py-1 pl-1 ${compact ? "pr-2 text-[10px]" : "pr-3 text-xs"}`}
                      >
                        <MeetingMemberAvatar
                          name={user.name}
                          avatarUrl={user.avatarUrl}
                          className={
                            compact
                              ? "h-6 w-6 text-[9px]"
                              : "h-7 w-7 text-[10px]"
                          }
                        />
                        <span className="font-medium text-foreground">
                          {user.name}
                        </span>
                        <ParticipantStatusBadge status={status} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Respuesta del usuario */}
              {ownParticipation && meeting.status === "SCHEDULED" && (
                <div
                  role="group"
                  aria-labelledby={`${titleId}-rsvp`}
                  className={`${compact ? "mt-3 p-2.5" : "mt-5 p-3 sm:p-4"} rounded-lg border border-primary/20 bg-primary-soft/40`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <p
                      id={`${titleId}-rsvp`}
                      className={`font-semibold text-foreground ${compact ? "text-xs" : "text-sm"}`}
                    >
                      ¿Asistirás a esta reunión?
                    </p>
                    <p
                      className="text-xs text-muted-foreground"
                      aria-live="polite"
                    >
                      Tu respuesta actual:{" "}
                      <span className="font-semibold text-foreground">
                        {getResponseLabel(ownParticipation.status)}
                      </span>
                    </p>
                  </div>
                  <div
                    className={`${compact ? "mt-2" : "mt-3"} flex flex-wrap items-center gap-2`}
                  >
                    {(["ACCEPTED", "DECLINED"] as const).map((status) => (
                      <form
                        key={status}
                        action={respondToMeetingFormAction.bind(
                          null,
                          meeting.id,
                        )}
                        className="flex-1 sm:flex-none"
                      >
                        <input type="hidden" name="status" value={status} />
                        <button
                          type="submit"
                          aria-pressed={ownParticipation.status === status}
                          className={getResponseButtonClassName(
                            status,
                            ownParticipation.status === status,
                            compact,
                          )}
                        >
                          {status === "ACCEPTED" ? (
                            <Check aria-hidden="true" size={16} />
                          ) : (
                            <X aria-hidden="true" size={16} />
                          )}
                          {status === "ACCEPTED" ? "Asistiré" : "No asistiré"}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              )}

              {/* Acciones del organizador */}
              {canManage && (
                <div
                  className={`${compact ? "mt-3 pt-3" : "mt-5 pt-4"} flex flex-wrap items-start gap-2 border-t border-border/60`}
                >
                  <details className="group w-full">
                    <summary
                      className={`inline-flex ${compact ? "min-h-9 text-xs" : "min-h-10 text-sm"} w-fit cursor-pointer list-none items-center gap-2 rounded-md border border-border px-3 py-2 font-medium hover:bg-surface-hover group-open:bg-surface-hover [&::-webkit-details-marker]:hidden ${focusRing}`}
                    >
                      <Pencil aria-hidden="true" size={15} />
                      Editar reunión
                    </summary>
                    <div className="mt-3 max-w-3xl rounded-lg border border-border/60 bg-surface-muted/40 p-3 sm:p-4">
                      <MeetingForm
                        action={updateMeetingAction.bind(null, meeting.id)}
                        participants={participants.filter(
                          (participant) => participant.id !== viewerId,
                        )}
                        meeting={meeting}
                        startsAtValue={startsAtValue}
                        endsAtValue={endsAtValue}
                      />
                    </div>
                  </details>

                  <form action={cancelMeetingAction.bind(null, meeting.id)}>
                    <button
                      type="submit"
                      className={`inline-flex ${compact ? "min-h-9 text-xs" : "min-h-10 text-sm"} cursor-pointer items-center gap-2 rounded-md px-3 py-2 font-medium text-danger hover:bg-danger-soft ${focusRing}`}
                    >
                      <X aria-hidden="true" size={15} />
                      Cancelar reunión
                    </button>
                  </form>
                </div>
              )}

              {isOrganizer && isCancelled && (
                <div
                  className={`${compact ? "mt-3 pt-3" : "mt-5 pt-4"} border-t border-border/60`}
                >
                  <MeetingDeleteControl
                    meetingId={meeting.id}
                    meetingTitle={meeting.title}
                    compact={compact}
                  />
                </div>
              )}
            </article>
          </li>
        );
      })}
    </ol>
  );
}

function MeetingDeleteControl({
  meetingId,
  meetingTitle,
  compact,
}: {
  meetingId: string;
  meetingTitle: string;
  compact: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleId = `delete-meeting-title-${meetingId}`;
  const descriptionId = `delete-meeting-description-${meetingId}`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={`inline-flex ${
          compact ? "min-h-9 text-xs" : "min-h-10 text-sm"
        } cursor-pointer items-center gap-2 rounded-md border border-danger/40 px-3 py-2 font-medium text-danger transition hover:bg-danger-soft ${focusRing}`}
      >
        <Trash2 aria-hidden="true" size={15} />
        Eliminar definitivamente
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            dialogRef.current?.close();
          }
        }}
        className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-brand-navy/45"
      >
        <div className="border-b border-border/70 px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger">
              <Trash2 aria-hidden="true" size={19} />
            </span>
            <div>
              <h2 id={titleId} className="text-base font-semibold">
                Eliminar reunión
              </h2>
              <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">
                Esta acción es permanente y no se puede deshacer.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm leading-6">
            ¿Quieres eliminar definitivamente{" "}
            <span className="font-semibold">{meetingTitle}</span>? Se eliminarán
            también sus participantes y recordatorios.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-surface-muted/30 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className={`inline-flex min-h-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:bg-surface-hover ${focusRing}`}
          >
            Conservar reunión
          </button>
          <form action={deleteMeetingAction.bind(null, meetingId)}>
            <button
              type="submit"
              className={`inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-danger bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:bg-danger/90 ${focusRing} sm:w-auto`}
            >
              <Trash2 aria-hidden="true" size={15} />
              Sí, eliminar
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}

function ScheduleEntry({
  icon,
  label,
  dateLabel,
  timeLabel,
  isoValue,
  compact = false,
}: {
  icon: React.ReactNode;
  label: string;
  dateLabel: string;
  timeLabel: string;
  isoValue: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1">
        <p
          className={`font-medium capitalize text-foreground ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {dateLabel}
        </p>
        <p
          className={`mt-0.5 font-bold tabular-nums text-foreground ${
            compact ? "text-sm" : "text-base"
          }`}
        >
          <time dateTime={isoValue}>{timeLabel}</time>
        </p>
      </dd>
    </div>
  );
}

function getAccentClassName(status: Meeting["status"]) {
  switch (status) {
    case "SCHEDULED":
      return "border-l-primary";
    case "CANCELLED":
      return "border-l-danger bg-surface-muted/20";
    default:
      return "border-l-success";
  }
}

function getResponseButtonClassName(
  status: "ACCEPTED" | "DECLINED",
  selected: boolean,
  compact = false,
) {
  const base = `inline-flex ${
    compact ? "min-h-9 px-2.5 text-xs" : "min-h-11 px-4 text-sm"
  } w-full cursor-pointer items-center justify-center gap-2 rounded-lg border py-2 font-semibold transition ${focusRing} sm:w-auto`;

  if (status === "ACCEPTED") {
    return `${base} ${
      selected
        ? "border-success bg-success text-white shadow-sm"
        : "border-success/50 bg-surface text-success hover:bg-success-soft"
    }`;
  }

  return `${base} ${
    selected
      ? "border-danger bg-danger text-white shadow-sm"
      : "border-danger/50 bg-surface text-danger hover:bg-danger-soft"
  }`;
}

function MeetingMemberAvatar({
  name,
  avatarUrl,
  className,
}: {
  name: string;
  avatarUrl: string | null;
  className: string;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase("es-MX") || "?";

  return (
    <span
      role="img"
      aria-label={`Foto de ${name}`}
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-primary-soft font-semibold text-primary ${className}`}
    >
      <span aria-hidden="true">{initials}</span>
      {avatarUrl && (
        <span
          aria-hidden="true"
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url("${avatarUrl}")` }}
        />
      )}
    </span>
  );
}

function MeetingStatus({ status }: { status: Meeting["status"] }) {
  const label =
    status === "SCHEDULED"
      ? "Programada"
      : status === "CANCELLED"
        ? "Cancelada"
        : "Realizada";

  const classes =
    status === "SCHEDULED"
      ? "bg-primary-soft text-primary"
      : status === "CANCELLED"
        ? "bg-danger-soft text-danger"
        : "bg-success-soft text-success";

  const Icon =
    status === "SCHEDULED" ? CalendarClock : status === "CANCELLED" ? X : Check;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}
    >
      <Icon aria-hidden="true" size={13} />
      {label}
    </span>
  );
}

function ParticipantStatusBadge({ status }: { status: ParticipantStatus }) {
  const classes =
    status === "ACCEPTED"
      ? "text-success"
      : status === "DECLINED"
        ? "text-danger"
        : "text-muted-foreground";

  const Icon =
    status === "ACCEPTED"
      ? CircleCheck
      : status === "DECLINED"
        ? CircleX
        : CircleHelp;

  return (
    <span className={`inline-flex items-center gap-1 font-medium ${classes}`}>
      <Icon aria-hidden="true" size={14} />
      {getResponseLabel(status)}
    </span>
  );
}

function countResponses(participants: Meeting["participants"]) {
  let accepted = 0;
  let declined = 0;
  let pending = 0;

  for (const { status } of participants) {
    if (status === "ACCEPTED") accepted += 1;
    else if (status === "DECLINED") declined += 1;
    else pending += 1;
  }

  return { accepted, declined, pending };
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes <= 0) return "—";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function getResponseLabel(status: ParticipantStatus) {
  switch (status) {
    case "ACCEPTED":
      return "Asistirá";
    case "DECLINED":
      return "No asistirá";
    default:
      return "Pendiente";
  }
}
