export type DashboardPeriod = "week" | "month";

export type DashboardPeriodSelection = {
  period: DashboardPeriod;
  date: string;
  today: string;
};

function isDateKey(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function getTodayDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Mexico_City",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function resolveDashboardPeriod(
  requestedPeriod?: string,
  requestedDate?: string,
): DashboardPeriodSelection {
  const today = getTodayDateKey();

  return {
    period: requestedPeriod === "week" ? "week" : "month",
    date: isDateKey(requestedDate) ? requestedDate : today,
    today,
  };
}
