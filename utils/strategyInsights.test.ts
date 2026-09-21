import { describe, expect, it } from 'vitest';
import data from '../data/vacationStats.json';
import { analyzeVacationStrategies, type VacationOpportunity } from './vacationStrategyUtils';
import { getStrategyInsights, type StrategyReference } from './strategyInsights';

const strategy: VacationOpportunity = {
  id: 'test', startDate: new Date(2026, 11, 24), endDate: new Date(2027, 0, 3),
  freeDays: 11, daysToTake: 4, vacationDays: [], efficiency: 2.75,
  description: '', periodName: 'Test', monthIndex: 11,
};
const reference: Record<string, StrategyReference> = { Test: {
  efficiencies: [2, 2, 2.75, 2.75, 3], maxEfficiency: 3,
  combinations: { '2.75_11': { years: [2028] }, '3.00_9': { years: [2032, 2027, 2027] }, '3.00_6': { years: [2030] } },
} };

describe('strategy comparison labels', () => {
  it('counts only strictly worse ratios, not half of the ties', () => {
    expect(getStrategyInsights(strategy, reference)).toMatchObject({ betterThanPercent: 40, isBest: false, sampleCount: 5 });
  });
  it('finds the next maximum across lengths and unsorted years, including the December after January', () => {
    expect(getStrategyInsights(strategy, reference)?.nextBestYear).toBe(2027);
  });
  it('does not describe ties as worse, even for a maximum or constant period', () => {
    const onlyTies = { Test: { ...reference.Test, efficiencies: [2.75, 2.75], maxEfficiency: 2.75 } };
    expect(getStrategyInsights(strategy, onlyTies)).toMatchObject({ betterThanPercent: 0, isBest: true });
  });
  it('never invents reference data or a future year outside the snapshot', () => {
    expect(getStrategyInsights(strategy, {})).toBeNull();
    expect(getStrategyInsights({ ...strategy, daysToTake: 0 }, reference)).toBeNull();
    expect(getStrategyInsights({ ...strategy, startDate: new Date(2100, 11, 24), endDate: new Date(2101, 0, 3) }, reference)?.nextBestYear).toBeNull();
  });
  it('reference samples match their distributions and contain no timezone-damaged ratios', () => {
    for (const period of Object.values(data)) {
      expect(period.samples).toBe(period.efficiencies.length);
      expect(period.maxEfficiency).toBe(Math.max(...period.efficiencies));
      expect(Object.values(period.combinations).reduce((sum, combination) => sum + combination.count, 0)).toBe(period.samples);
      expect(period.efficiencies.every(value => value >= 2)).toBe(true);
    }
  });
  it.each([2026, 2027])('next best years for %i really contain the claimed maximum', year => {
    const nextYears = new Map<number, VacationOpportunity[]>();
    for (const candidate of analyzeVacationStrategies(year)) {
      const info = getStrategyInsights(candidate);
      if (!info?.nextBestYear) continue;
      if (!nextYears.has(info.nextBestYear)) nextYears.set(info.nextBestYear, analyzeVacationStrategies(info.nextBestYear));
      expect(nextYears.get(info.nextBestYear)!.some(other => other.startDate.getFullYear() === info.nextBestYear && other.periodName === candidate.periodName && other.efficiency === info.maxEfficiency)).toBe(true);
    }
  });
});
