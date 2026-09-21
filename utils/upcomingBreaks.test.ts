import { describe, expect, it } from 'vitest';
import { getUpcomingBreaks } from './upcomingBreaks';
import { formatDateKey, getPolishHolidays } from './dateUtils';

describe('upcoming complete breaks', () => {
  it('separates the next natural break from a one-day bridge, including next year', () => {
    const { natural, bridge } = getUpcomingBreaks('2026-09-21');
    expect([formatDateKey(natural!.start), formatDateKey(natural!.end), natural!.days, natural!.leave])
      .toEqual(['2026-12-24', '2026-12-27', 4, null]);
    expect([formatDateKey(bridge!.start), formatDateKey(bridge!.end), formatDateKey(bridge!.leave!), bridge!.days])
      .toEqual(['2027-05-27', '2027-05-30', '2027-05-28', 4]);
  });
  it('finds a holiday-weekend connection, not an ordinary Friday off', () => {
    const { bridge } = getUpcomingBreaks('2026-05-04');
    expect(formatDateKey(bridge!.start)).toBe('2026-06-04');
    expect(formatDateKey(bridge!.leave!)).toBe('2026-06-05');
  });
  it('includes breaks starting today but skips already started ones', () => {
    expect(formatDateKey(getUpcomingBreaks('2026-06-04').bridge!.leave!)).toBe('2026-06-05');
    expect(formatDateKey(getUpcomingBreaks('2026-06-05').bridge!.start)).toBe('2027-05-27');
    expect(formatDateKey(getUpcomingBreaks('2026-12-25').natural!.start)).toBe('2027-01-01');
  });
  it('does not invent days to redeem for Saturday holidays', () => {
    const { natural } = getUpcomingBreaks('2026-08-14');
    expect(formatDateKey(natural!.start)).toBe('2026-12-24');
  });
  it('bounds links to the supported years', () => {
    expect(getUpcomingBreaks('2100-01-01')).toEqual({});
    for (const value of Object.values(getUpcomingBreaks('2099-12-01'))) expect(value!.end.getFullYear()).toBeLessThanOrEqual(2099);
  });
  it('keeps all breaks continuous and charges exactly their working days', () => {
    for (const from of ['2025-12-29', '2026-01-01', '2026-09-21', '2027-04-01']) {
      for (const item of Object.values(getUpcomingBreaks(from))) {
        const days: string[] = [], working: string[] = [];
        for (const d = new Date(item!.start); d <= item!.end; d.setDate(d.getDate() + 1)) {
          const key = formatDateKey(d); days.push(key);
          if (d.getDay() !== 0 && d.getDay() !== 6 && !getPolishHolidays(d.getFullYear()).has(key)) working.push(key);
        }
        expect(days.length).toBe(item!.days);
        expect(days[0] >= from).toBe(true);
        expect(working).toEqual(item!.leave ? [formatDateKey(item!.leave)] : []);
      }
    }
  });
});
