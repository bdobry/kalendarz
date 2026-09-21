import { describe, expect, it } from 'vitest';
import { analyzeVacationStrategies, type VacationOpportunity } from './vacationStrategyUtils';
import { selectStrategyPreview, strategyPlannerHref } from './strategyPreview';

const opportunity = (id: string, start: string, end: string, efficiency: number, periodName: string): VacationOpportunity => ({
  id, startDate: new Date(`${start}T12:00:00`), endDate: new Date(`${end}T12:00:00`),
  vacationDays: [new Date(`${start}T12:00:00`)], daysToTake: 2, freeDays: efficiency * 2,
  efficiency, periodName, description: periodName, monthIndex: Number(start.slice(5, 7)) - 1,
});

describe('year strategy shortlist', () => {
  it('selects strong, different holiday periods without overlapping variants or mutating the input', () => {
    const source = [
      opportunity('christmas', '2026-12-21', '2026-12-28', 4, 'Boże Narodzenie'),
      opportunity('christmas-variant', '2026-12-22', '2026-12-29', 3, 'Boże Narodzenie'),
      opportunity('overlap', '2026-12-27', '2027-01-03', 3, 'Nowy Rok'),
      opportunity('spring', '2026-05-01', '2026-05-08', 3, 'Majówka'),
      opportunity('summer', '2026-06-04', '2026-06-11', 3.5, 'Boże Ciało'),
      opportunity('other-year', '2027-01-01', '2027-01-08', 9, 'Trzech Króli'),
    ];
    const before = source.map(item => item.id);
    expect(selectStrategyPreview(source, 2026).map(item => item.id).sort()).toEqual(['christmas', 'spring', 'summer']);
    expect(source.map(item => item.id)).toEqual(before);
  });
  it('returns only available distinct choices, including an empty selection', () => {
    const source = [opportunity('one', '2026-01-01', '2026-01-09', 4, 'Nowy Rok')];
    expect(selectStrategyPreview(source, 2026, 0)).toEqual([]);
    expect(selectStrategyPreview([], 2026)).toEqual([]);
    expect(selectStrategyPreview(source, 2026)).toEqual(source);
  });
  it.each([2025, 2026, 2027, 2030, 2099])('offers three different real holiday breaks in %i', year => {
    const picks = selectStrategyPreview(analyzeVacationStrategies(year), year);
    expect(picks).toHaveLength(3);
    expect(new Set(picks.map(item => item.periodName)).size).toBe(3);
    expect(picks.every((item, i) => picks.slice(i + 1).every(other => item.endDate < other.startDate || item.startDate > other.endDate))).toBe(true);
    expect(picks.every(item => item.startDate.getFullYear() === year)).toBe(true);
    expect(picks[0].freeDays).toBeGreaterThanOrEqual(14);
    const longOptions = analyzeVacationStrategies(year).filter(item => item.startDate.getFullYear() === year && item.freeDays >= 14 && item.vacationDays.every(date => date.getFullYear() <= 2099));
    expect(picks[0].freeDays / picks[0].daysToTake).toBe(Math.max(...longOptions.map(item => item.freeDays / item.daysToTake)));
  });
  it('keeps the best long break even when shorter choices have a higher ratio', () => {
    const long = { ...opportunity('long', '2026-12-19', '2027-01-01', 2.8, 'Boże Narodzenie'), freeDays: 14, daysToTake: 5 };
    const longerCostlier = { ...long, id: 'costlier', freeDays: 16, daysToTake: 7, endDate: new Date('2027-01-03T12:00:00') };
    const short = opportunity('short', '2026-05-01', '2026-05-06', 3, 'Majówka');
    const picks = selectStrategyPreview([short, longerCostlier, long], 2026);
    expect(picks.map(item => item.id)).toEqual(['long', 'short']);
  });
  it('keeps year and selected proposal in the fragment without adding days', () => {
    const strategy = opportunity('2026-12-21_2027-01-03', '2026-12-21', '2027-01-03', 4, 'Boże Narodzenie');
    const href = strategyPlannerHref(2026, strategy);
    const params = new URLSearchParams(href.split('#')[1]);
    expect(params.get('rok')).toBe('2026');
    expect(params.get('sekcja')).toBe('strategia');
    expect(params.get('propozycja')).toBe(strategy.id);
    expect(params.has('dni')).toBe(false);
  });
});
