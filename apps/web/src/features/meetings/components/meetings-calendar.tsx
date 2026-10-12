"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarClock } from "lucide-react";

import type {
  Meeting,
  MeetingParticipantOption,
} from "../schemas/meetings.schema";
import MeetingList from "./meeting-list";

const weekdays = [
  { short: "Lun", full: "lunes" },
  { short: "Mar", full: "martes" },
  { short: "Mié", full: "miércoles" },
  { short: "Jue", full: "jueves" },
  { short: "Vie", full: "viernes" },
  { short: "Sáb", full: "sábado" },
  { short: "Dom", full: "domingo" },
];

const monthFormatter = new Intl.DateTimeFormat("es-MX", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Reutiliza los formatters por zona horaria en lugar de crear uno por cada chip.
const timeFormatters = new Map<string, Intl.DateTimeFormat>();

function formatMeetingTime(meeting: Meeting) {
  let formatter = timeFormatters.get(meeting.timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("es-MX", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: meeting.timeZone,
    });
    timeFormatters.set(meeting.timeZone, formatter);
  }

  return formatter.format(new Date(meeting.startsAt));
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function meetingDateKey(meeting: Meeting) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: meeting.timeZone,
  }).formatToParts(new Date(meeting.startsAt));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function getCalendarDays(month: Date) {
  const firstOfMonth = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1),
  );
  const mondayOffset = (firstOfMonth.getUTCDay() + 6) % 7;
  const dayCount = new Date(
    Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const cellCount = Math.ceil((mondayOffset + dayCount) / 7) * 7;
  const start = new Date(firstOfMonth);
  start.setUTCDate(start.getUTCDate() - mondayOffset);

  return Array.from({ length: cellCount }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return day;
  });
}

function getStatusChipClassName(status: Meeting["status"]) {
  switch (status) {
    case "CANCELLED":
      return "bg-surface-muted text-muted-foreground line-through";
    case "COMPLETED":
      return "bg-success-soft text-success";
    default:
      return "bg-primary-soft text-primary";
  }
}

function getStatusDotClassName(status: Meeting["status"]) {
  switch (status) {
    case "CANCELLED":
      return "bg-muted-foreground/50";
    case "COMPLETED":
      return "bg-success";
    default:
      return "bg-primary";
  }
}

function pluralizeMeetings(count: number) {
  return `${count} ${count === 1 ? "reunión" : "reuniones"}`;
}

export default function MeetingsCalendar({
  meetings,
  participants,
  viewerId,
  initialToday,
}: {
  meetings: Meeting[];
  participants: MeetingParticipantOption[];
  viewerId: string;
  initialToday: string;
}) {
  const [selectedDate, setSelectedDate] = useState(initialToday);
  const month = useMemo(
    () => new Date(`${selectedDate.slice(0, 7)}-01T00:00:00.000Z`),
    [selectedDate],
  );
  const days = useMemo(() => getCalendarDays(month), [month]);
  const monthKey = toDateKey(month).slice(0, 7);

  const meetingsByDate = useMemo(() => {
    const grouped = new Map<string, Meeting[]>();

    for (const meeting of meetings) {
      const key = meetingDateKey(meeting);
      const items = grouped.get(key) ?? [];
      items.push(meeting);
      grouped.set(key, items);
    }

    for (const items of grouped.values()) {
      items.sort(
        (left, right) =>
          Date.parse(left.startsAt) - Date.parse(right.startsAt) ||
          left.title.localeCompare(right.title, "es"),
      );
    }

    return grouped;
  }, [meetings]);

  const monthMeetings = meetings.filter(
    (meeting) => meetingDateKey(meeting).slice(0, 7) === monthKey,
  );
  const selectedMeetings = meetingsByDate.get(selectedDate) ?? [];
  const todayKey = initialToday;
  const isSelectedToday = selectedDate === todayKey;

  function navigateMonth(direction: -1 | 1) {
    const nextMonth = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + direction, 1),
    );
    const nextMonthKey = toDateKey(nextMonth).slice(0, 7);
    setSelectedDate(`${nextMonthKey}-01`);
  }

  function goToToday() {
    setSelectedDate(initialToday);
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(17rem,0.8fr)] xl:grid-cols-[minmax(0,1.7fr)_minmax(20rem,0.8fr)] xl:gap-6">
      <section
        aria-label="Calendario de reuniones"
        className="min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-(--shadow-panel)"
      >
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                aria-label="Mes anterior"
                className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground ${focusRing}`}
              >
                <ArrowLeft aria-hidden="true" size={18} />
              </button>
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                aria-label="Mes siguiente"
                className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground ${focusRing}`}
              >
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </div>
            <h2
              aria-live="polite"
              className="mx-1 min-w-36 text-xl font-semibold capitalize leading-tight"
            >
              {monthFormatter.format(month)}
            </h2>
            <button
              type="button"
              onClick={goToToday}
              className={`min-h-10 cursor-pointer rounded-lg border border-primary/30 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft ${focusRing}`}
            >
              Ir a hoy
            </button>
          </div>

          <p className="rounded-lg border border-border/70 bg-surface-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <strong className="mr-1 tabular-nums text-foreground">
              {monthMeetings.length}
            </strong>
            {monthMeetings.length === 1
              ? "reunión este mes"
              : "reuniones este mes"}
          </p>
        </header>

        <div>
          <div className="grid grid-cols-7 border-b border-border/60 bg-surface-muted/30">
            {weekdays.map((weekday) => (
              <div
                key={weekday.short}
                className="px-1 py-2.5 text-center text-xs font-semibold text-muted-foreground"
              >
                <abbr title={weekday.full} className="no-underline">
                  {weekday.short}
                </abbr>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dateKey = toDateKey(day);
              const dayMeetings = meetingsByDate.get(dateKey) ?? [];
              const inCurrentMonth = dateKey.slice(0, 7) === monthKey;
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayKey;

              const label = [
                dateFormatter.format(day),
                dayMeetings.length ? pluralizeMeetings(dayMeetings.length) : "",
                isToday ? "hoy" : "",
              ]
                .filter(Boolean)
                .join(", ");

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={label}
                  className={`relative flex min-h-16 cursor-pointer flex-col items-center border-b border-r border-border/50 p-1 text-left transition-colors last:border-r-0 hover:bg-surface-hover focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:min-h-28 sm:items-stretch sm:p-2 xl:min-h-32 ${
                    isSelected
                      ? "bg-primary-soft/60 shadow-[inset_0_0_0_2px_var(--color-primary)]"
                      : inCurrentMonth
                        ? "bg-surface"
                        : "bg-surface-muted/30"
                  } ${inCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <span
                    aria-hidden="true"
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-sm tabular-nums sm:self-start ${
                      isToday
                        ? "bg-primary font-bold text-primary-foreground"
                        : isSelected
                          ? "font-bold text-primary"
                          : inCurrentMonth
                            ? "font-medium"
                            : "font-normal"
                    }`}
                  >
                    {day.getUTCDate()}
                  </span>

                  {/* Móvil: puntos de estado. Sin scroll horizontal. */}
                  {dayMeetings.length > 0 && (
                    <span
                      aria-hidden="true"
                      className="mt-1.5 flex items-center gap-0.5 sm:hidden"
                    >
                      {dayMeetings.slice(0, 3).map((meeting) => (
                        <span
                          key={meeting.id}
                          className={`h-1.5 w-1.5 rounded-full ${getStatusDotClassName(
                            meeting.status,
                          )}`}
                        />
                      ))}
                      {dayMeetings.length > 3 && (
                        <span className="ml-0.5 text-[10px] font-semibold leading-none text-muted-foreground">
                          +
                        </span>
                      )}
                    </span>
                  )}

                  {/* Tablet y escritorio: chips con hora y título. */}
                  <span
                    aria-hidden="true"
                    className="mt-1.5 hidden space-y-1 sm:block"
                  >
                    {dayMeetings.slice(0, 2).map((meeting) => (
                      <span
                        key={meeting.id}
                        title={meeting.title}
                        className={`block truncate rounded px-1.5 py-1 text-xs font-medium ${getStatusChipClassName(
                          meeting.status,
                        )}`}
                      >
                        <span className="tabular-nums">
                          {formatMeetingTime(meeting)}
                        </span>{" "}
                        {meeting.title}
                      </span>
                    ))}
                    {dayMeetings.length > 2 && (
                      <span className="block px-1 text-xs font-medium text-muted-foreground">
                        +{dayMeetings.length - 2} más
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <footer className="flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border/60 bg-surface-muted/30 px-4 py-3 text-xs text-muted-foreground sm:px-5">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-primary"
              aria-hidden="true"
            />
            Programada
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-success"
              aria-hidden="true"
            />
            Realizada
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full bg-muted-foreground/50"
              aria-hidden="true"
            />
            Cancelada
          </span>
        </footer>
      </section>

      <aside
        aria-labelledby="selected-meetings-title"
        className="min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1"
      >
        <div className="mb-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <CalendarClock
            aria-hidden="true"
            size={18}
            className="text-primary"
          />
          <h2
            id="selected-meetings-title"
            className="text-base font-semibold capitalize xl:text-lg"
          >
            {dateFormatter.format(new Date(`${selectedDate}T00:00:00.000Z`))}
          </h2>
          {isSelectedToday && (
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              Hoy
            </span>
          )}
          <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs tabular-nums text-muted-foreground">
            {pluralizeMeetings(selectedMeetings.length)}
          </span>
        </div>

        {selectedMeetings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <CalendarClock
              aria-hidden="true"
              size={26}
              className="mx-auto text-muted-foreground"
            />
            <p className="mt-3 text-sm font-semibold">
              No hay reuniones este día
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecciona otro día del calendario o programa una nueva reunión.
            </p>
          </div>
        ) : (
          <MeetingList
            meetings={selectedMeetings}
            participants={participants}
            viewerId={viewerId}
            compact
          />
        )}
      </aside>
    </div>
  );
}
