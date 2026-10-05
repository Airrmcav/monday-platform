import { BadRequestException } from '@nestjs/common';

export type DashboardPeriod = 'week' | 'month';

export type DashboardPeriodBounds = {
  period: DashboardPeriod;
  date: string;
  startAt: Date;
  endAt: Date;
};

const mexicoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/Mexico_City',
});

const mexicoDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'America/Mexico_City',
});

function formatDateKey(date: Date) {
  const parts = mexicoDateFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isValidDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function dateKeyInMexicoCity(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const targetTime = Date.UTC(year, month - 1, day);
  let timestamp = targetTime;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = mexicoDateTimeFormatter.formatToParts(new Date(timestamp));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value ?? 0);
    const localTimeAsUtc = Date.UTC(
      part('year'),
      part('month') - 1,
      part('day'),
      part('hour'),
      part('minute'),
      part('second'),
    );
    const adjustment = targetTime - localTimeAsUtc;

    if (adjustment === 0) {
      break;
    }

    timestamp += adjustment;
  }

  return new Date(timestamp);
}

export function getDashboardPeriodBounds(
  requestedPeriod?: string,
  requestedDate?: string,
): DashboardPeriodBounds {
  if (
    requestedPeriod !== undefined &&
    requestedPeriod !== 'week' &&
    requestedPeriod !== 'month'
  ) {
    throw new BadRequestException('El período debe ser week o month.');
  }

  if (requestedDate !== undefined && !isValidDateKey(requestedDate)) {
    throw new BadRequestException('La fecha debe tener el formato YYYY-MM-DD.');
  }

  const period: DashboardPeriod =
    requestedPeriod === 'week' ? 'week' : 'month';
  const date = requestedDate ?? formatDateKey(new Date());
  const anchor = new Date(`${date}T00:00:00.000Z`);
  let start = new Date(anchor);
  let end = new Date(anchor);

  if (period === 'week') {
    const mondayOffset = (anchor.getUTCDay() + 6) % 7;
    start.setUTCDate(anchor.getUTCDate() - mondayOffset);
    end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);
  } else {
    start = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1),
    );
    end = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1),
    );
  }

  const dateKey = (value: Date) => value.toISOString().slice(0, 10);

  return {
    period,
    date,
    startAt: dateKeyInMexicoCity(dateKey(start)),
    endAt: dateKeyInMexicoCity(dateKey(end)),
  };
}
