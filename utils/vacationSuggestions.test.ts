import { describe, expect, it } from 'vitest';
import { formatDateKey } from './dateUtils';
import { calculateLeave } from './leaveCalculator';
import { getPlanningDate, getVacationSuggestions } from './vacationSuggestions';

describe('upcoming vacation suggestions', () => {
  it('uses the Polish civil date at midnight and New Year boundaries', () => {
    expect(getPlanningDate(new Date('2026-09-14T22:30:00Z'))).toBe('2026-09-15');
    expect(getPlanningDate(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01');
  });
  it('only recommends upcoming, distinct breaks within the leave budget', () => {
    const picks = getVacationSuggestions(2026, '2026-09-14', 3);
    expect(picks.length).toBeGreaterThan(0);
    for (const pick of picks) {
      expect(formatDateKey(pick.startDate) >= '2026-09-14').toBe(true);
      expect(pick.startDate.getFullYear()).toBe(2026);
      expect(pick.daysToTake).toBeLessThanOrEqual(3);
      const result = calculateLeave(formatDateKey(pick.startDate), formatDateKey(pick.endDate));
      expect(result.leaveDays).toBe(pick.daysToTake);
      expect(result.totalDays).toBe(pick.freeDays);
      expect(pick.vacationDays.length).toBe(pick.daysToTake);
    }
    for (let i = 0; i < picks.length; i++) for (let j = i + 1; j < picks.length; j++) {
      expect(formatDateKey(picks[i].endDate) < formatDateKey(picks[j].startDate) || formatDateKey(picks[j].endDate) < formatDateKey(picks[i].startDate)).toBe(true);
    }
  });
  it('prioritizes the longest break within the selected leave budget', () => {
    for (const budget of [1, 3, 5, 10]) {
      const picks = getVacationSuggestions(2027, '2027-01-01', budget);
      expect(picks.length).toBeGreaterThan(0);
      for (let i = 1; i < picks.length; i++) expect(picks[i - 1].freeDays).toBeGreaterThanOrEqual(picks[i].freeDays);
      expect(picks.every(p => p.daysToTake <= budget)).toBe(true);
    }
  });
  it('can spend the whole budget on useful working-day extensions', () => {
    const five = getVacationSuggestions(2026, '2026-09-14', 5)[0];
    expect(five.freeDays).toBe(12);
    expect(five.daysToTake).toBe(5);
    const ten = getVacationSuggestions(2026, '2026-09-14', 10)[0];
    expect(ten.freeDays).toBe(20);
    expect(ten.daysToTake).toBe(10);
    const late = getVacationSuggestions(2026, '2026-12-28', 3)[0];
    expect([formatDateKey(late.startDate), formatDateKey(late.endDate), late.freeDays, late.daysToTake]).toEqual(['2026-12-31', '2027-01-06', 7, 3]);
  });
  it('includes ordinary weekends even when efficiency is below the old planner threshold', () => {
    const result = getVacationSuggestions(2027, '2027-07-01', 5);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every(pick => pick.daysToTake <= 5)).toBe(true);
  });
  it('shows an empty state rather than suggesting past breaks at year end', () => {
    expect(getVacationSuggestions(2026, '2027-01-01', 10)).toEqual([]);
  });
});
