import { BadRequestException } from '@nestjs/common';

import { getDashboardPeriodBounds } from './dashboard-period.js';

describe('getDashboardPeriodBounds', () => {
  it('returns Monday-to-Monday boundaries for a selected week in Mexico City', () => {
    const bounds = getDashboardPeriodBounds('week', '2026-10-07');

    expect(bounds.startAt.toISOString()).toBe('2026-10-05T06:00:00.000Z');
    expect(bounds.endAt.toISOString()).toBe('2026-10-12T06:00:00.000Z');
  });

  it('returns month boundaries for a selected month in Mexico City', () => {
    const bounds = getDashboardPeriodBounds('month', '2026-10-05');

    expect(bounds.startAt.toISOString()).toBe('2026-10-01T06:00:00.000Z');
    expect(bounds.endAt.toISOString()).toBe('2026-11-01T06:00:00.000Z');
  });

  it('rejects invalid period dates', () => {
    expect(() => getDashboardPeriodBounds('month', '2026-02-30')).toThrow(
      BadRequestException,
    );
  });
});
