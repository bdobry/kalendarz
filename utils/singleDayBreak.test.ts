import { describe, expect, it } from 'vitest';
import { formatDateKey, getSingleDayBreak } from './dateUtils';

describe('getSingleDayBreak', () => {
  it.each([
    ['2026-01-02', '2026-01-01', '2026-01-04', 4],
    ['2026-01-05', '2026-01-03', '2026-01-06', 4],
    ['2026-06-05', '2026-06-04', '2026-06-07', 4],
    ['2012-12-31', '2012-12-29', '2013-01-01', 4],
    ['2025-12-23', '2025-12-23', '2025-12-28', 6],
  ])('expands %s without spending a second day of leave', (leave, start, end, length) => {
    const result = getSingleDayBreak(new Date(`${leave}T12:00:00`));
    expect(formatDateKey(result.start)).toBe(start);
    expect(formatDateKey(result.end)).toBe(end);
    expect(result.length).toBe(length);
  });
});
