import { describe, expect, it } from 'vitest';
import { formatDateKey } from './dateUtils';
import { calculateLeave } from './leaveCalculator';
import { getTwoDayBreaks } from './vacationSuggestions';

describe('getTwoDayBreaks', () => {
  it('joins both January bridges into six days off for exactly two leave days', () => {
    const january = getTwoDayBreaks(2026)[0];
    expect(january.vacationDays.map(formatDateKey)).toEqual(['2026-01-02', '2026-01-05']);
    expect(formatDateKey(january.startDate)).toBe('2026-01-01');
    expect(formatDateKey(january.endDate)).toBe('2026-01-06');
    expect(january.freeDays).toBe(6);
  });

  it.each([2024, 2025, 2026, 2027, 2028, 2099])('returns distinct chronological breaks that actually cost two days in %i', year => {
    const breaks = getTwoDayBreaks(year);
    expect(breaks.length).toBeGreaterThan(0);
    breaks.forEach((period, index) => {
      expect(period.daysToTake).toBe(2);
      expect(period.vacationDays).toHaveLength(2);
      expect(period.freeDays).toBeGreaterThanOrEqual(5);
      expect(calculateLeave(formatDateKey(period.startDate), formatDateKey(period.endDate))).toMatchObject({ leaveDays: 2, totalDays: period.freeDays });
      if (index) expect(period.startDate.getTime()).toBeGreaterThan(breaks[index - 1].endDate.getTime());
    });
  });
});
