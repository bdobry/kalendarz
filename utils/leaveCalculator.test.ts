import { describe, it, expect } from 'vitest';
import { calculateLeave } from './leaveCalculator';
describe('date-range leave calculator', () => {
  it('counts both endpoints and skips weekends and Polish holidays', () => {
    expect(calculateLeave('2026-04-04', '2026-04-06')).toEqual({ totalDays: 3, leaveDays: 0, weekends: 2, holidaysOnWeekdays: 1 });
    expect(calculateLeave('2026-04-27', '2026-05-03')).toEqual({ totalDays: 7, leaveDays: 4, weekends: 2, holidaysOnWeekdays: 1 });
  });
  it('applies Christmas Eve from 2025 and does not double-count Saturday holidays', () => {
    expect(calculateLeave('2024-12-24', '2024-12-24').leaveDays).toBe(1);
    expect(calculateLeave('2025-12-24', '2025-12-28')).toEqual({ totalDays: 5, leaveDays: 0, weekends: 2, holidaysOnWeekdays: 3 });
  });
  it('crosses year, leap-day and DST boundaries by calendar days', () => {
    expect(calculateLeave('2026-12-31', '2027-01-06')).toEqual({ totalDays: 7, leaveDays: 3, weekends: 2, holidaysOnWeekdays: 2 });
    expect(calculateLeave('2024-02-28', '2024-03-01').totalDays).toBe(3);
    expect(calculateLeave('2026-03-28', '2026-03-30').totalDays).toBe(3);
  });
  it('rejects malformed, reversed, impossible and excessive date ranges', () => {
    for (const [start, end] of [['2026-02-30','2026-03-01'], ['2026-05-03','2026-05-01'], ['', '2026-01-01'], ['2026-01-01','2027-01-02'], ['2023-12-31','2024-01-01']]) expect(() => calculateLeave(start, end)).toThrow();
  });
});
