"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";

import type {
  Meeting,
  MeetingParticipantOption,
} from "../schemas/meetings.schema";
import type { MeetingFormState } from "../actions/meeting-actions";

const emptyState: MeetingFormState = { error: "" };

export default function MeetingForm({
  action,
  participants,
  meeting,
  startsAtValue,
  endsAtValue,
}: {
  action: (
    state: MeetingFormState,
    formData: FormData,
  ) => Promise<MeetingFormState>;
  participants: MeetingParticipantOption[];
  meeting?: Meeting;
  startsAtValue?: string;
  endsAtValue?: string;
}) {
  const [state, formAction, pending] = useActionState(action, emptyState);
  const selectedParticipantIds = new Set(
    meeting?.participants.map((item) => item.user.id) ?? [],
  );

  return (
    <form action={formAction} aria-busy={pending} className="space-y-5">
      {state.error && (
        <p
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {state.error}
        </p>
      )}

        <Field label="Nombre de la reunión" error={state.fieldErrors?.title}>
          <input
            required
            minLength={3}
            maxLength={200}
            name="title"
            defaultValue={meeting?.title}
            className={inputClassName}
            placeholder="Ej. Revisión semanal del equipo"
          />
        </Field>

      <Field label="Descripción" error={state.fieldErrors?.description}>
        <textarea
          name="description"
          rows={3}
          maxLength={5000}
          defaultValue={meeting?.description ?? ""}
          className={`${inputClassName} resize-y`}
          placeholder="Temas a tratar (opcional)"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Inicio" error={state.fieldErrors?.startsAt}>
          <input
            required
            type="datetime-local"
            name="startsAt"
            defaultValue={startsAtValue}
            className={inputClassName}
          />
        </Field>
        <Field label="Fin" error={state.fieldErrors?.endsAt}>
          <input
            required
            type="datetime-local"
            name="endsAt"
            defaultValue={endsAtValue}
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ubicación" error={state.fieldErrors?.location}>
          <input
            name="location"
            maxLength={300}
            defaultValue={meeting?.location ?? ""}
            className={inputClassName}
            placeholder="Sala o dirección (opcional)"
          />
        </Field>
        <Field label="Enlace de reunión" error={state.fieldErrors?.meetingUrl}>
          <input
            type="url"
            name="meetingUrl"
            defaultValue={meeting?.meetingUrl ?? ""}
            className={inputClassName}
            placeholder="https://… (opcional)"
          />
        </Field>
      </div>

      <fieldset>
        <legend className="text-sm font-medium">Invitar participantes</legend>
        <p className="mt-1 text-xs text-muted-foreground">
          Quienes invites podrán consultar la reunión y confirmar su asistencia.
        </p>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border/70 p-2">
          {participants.length === 0 ? (
            <p className="p-2 text-sm text-muted-foreground">
              No hay otros usuarios activos para invitar.
            </p>
          ) : (
            <ul className="grid gap-1 sm:grid-cols-2">
              {participants.map((participant) => (
                <li key={participant.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-hover">
                    <input
                      type="checkbox"
                      name="participantIds"
                      value={participant.id}
                      defaultChecked={selectedParticipantIds.has(
                        participant.id,
                      )}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <span className="truncate">{participant.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        {state.fieldErrors?.participantIds?.[0] && (
          <p className="mt-1 text-xs text-danger">
            {state.fieldErrors.participantIds[0]}
          </p>
        )}
      </fieldset>

      <p className="text-xs text-muted-foreground">
        Las fechas se capturan en la zona horaria de Ciudad de México.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex cursor-pointer min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-60"
      >
        {pending && (
          <LoaderCircle
            aria-hidden="true"
            size={16}
            className="animate-spin motion-reduce:animate-none"
          />
        )}
        {pending
          ? "Guardando…"
          : meeting
            ? "Guardar cambios"
            : "Programar reunión"}
      </button>
    </form>
  );
}

const inputClassName =
  "mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
      {error?.[0] && (
        <span className="mt-1 block text-xs text-danger">{error[0]}</span>
      )}
    </label>
  );
}
