import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export const APP_TIME_ZONE = "America/Mexico_City";
export const APP_TIME_ZONE_LABEL = "Hora de Ciudad de México";

const localDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function localDateTimeToIso(value: string): string | null {
  if (!localDateTimePattern.test(value)) {
    return null;
  }

  try {
    const date = fromZonedTime(value, APP_TIME_ZONE);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const reconstructed = formatInTimeZone(
      date,
      APP_TIME_ZONE,
      "yyyy-MM-dd'T'HH:mm",
    );

    if (reconstructed !== value) {
      return null;
    }

    return date.toISOString();
  } catch {
    return null;
  }
}

export function isoToLocalDateTime(value: string): string {
  return formatInTimeZone(new Date(value), APP_TIME_ZONE, "yyyy-MM-dd'T'HH:mm");
}
