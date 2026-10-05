"use client";

import { useEffect, useState } from "react";

import { CalendarClock } from "lucide-react";
import {
  APP_TIME_ZONE,
  APP_TIME_ZONE_LABEL,
  isoToLocalDateTime,
  localDateTimeToIso,
} from "@/lib/date-time";

type TaskDateFieldsProps = {
  mode?: "create" | "edit";
  initialDueAt?: string;
  disabled?: boolean;
  errors?: {
    dueAt?: string[];
  };
};

const inputClassName =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

const currentDateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: APP_TIME_ZONE,
});

export default function TaskDateFields({
  mode = "create",
  initialDueAt,
  disabled = false,
  errors,
}: TaskDateFieldsProps) {
  const initialDueValue = initialDueAt ? isoToLocalDateTime(initialDueAt) : "";

  const [dueValue, setDueValue] = useState(initialDueValue);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    const updateCurrentDate = () => setCurrentDate(new Date());

    updateCurrentDate();

    const intervalId = window.setInterval(updateCurrentDate, 1000);

    return () => window.clearInterval(intervalId);
  }, [mode]);

  const dueIso = dueValue ? localDateTimeToIso(dueValue) : null;
  const dueInvalid = Boolean(dueValue && !dueIso);

  const dueError = dueInvalid
    ? "Ingresa una fecha y hora de entrega válidas."
    : errors?.dueAt?.join(" ");

  const submittedDueAt =
    initialDueAt && dueValue === initialDueValue
      ? initialDueAt
      : dueValue
        ? (dueIso ?? "invalid")
        : "";

  return (
    <section aria-labelledby="task-dates-title" className="space-y-4">
      <div>
        <h3
          id="task-dates-title"
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <CalendarClock
            aria-hidden="true"
            size={18}
            className="text-primary"
          />
          Fechas de la tarea
        </h3>

        <p id="task-time-zone" className="mt-2 text-xs text-muted-foreground">
          {APP_TIME_ZONE_LABEL}. Captura la fecha y la hora de entrega.
        </p>
      </div>

      {mode === "create" ? (
        <div className="rounded-xl border border-border bg-primary-soft p-4">
          <p className="text-sm font-medium">Fecha y hora actual</p>

          <p className="mt-2 text-base font-semibold text-primary">
            {currentDate ? (
              <time dateTime={currentDate.toISOString()}>
                {currentDateFormatter.format(currentDate)}
              </time>
            ) : (
              "Cargando fecha y hora…"
            )}
          </p>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            El inicio se registrará al guardar la tarea.
          </p>
        </div>
      ) : (
        <p className="rounded-xl bg-primary-soft p-4 text-sm leading-6 text-muted-foreground">
          Puedes modificar la entrega. La fecha de inicio original se
          conservará.
        </p>
      )}

      <input
        type="hidden"
        name="dueAt"
        value={submittedDueAt}
        disabled={disabled}
      />

      <div>
        <label htmlFor="task-due-at" className="text-sm font-medium">
          Entrega
        </label>

        <input
          id="task-due-at"
          type="datetime-local"
          step={60}
          value={dueValue}
          required
          disabled={disabled}
          onChange={(event) => setDueValue(event.target.value)}
          aria-invalid={Boolean(dueError)}
          aria-describedby={
            dueError ? "task-time-zone task-due-at-error" : "task-time-zone"
          }
          className={inputClassName}
        />

        {dueError && (
          <p id="task-due-at-error" className="mt-2 text-sm text-danger">
            {dueError}
          </p>
        )}
      </div>
    </section>
  );
}
