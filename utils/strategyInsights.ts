import referenceData from '../data/vacationStats.json' with { type: 'json' };
import type { VacationOpportunity } from './vacationStrategyUtils';

export const STRATEGY_REFERENCE_START = 2024;
export const STRATEGY_REFERENCE_END = 2100;

export interface StrategyReference {
  efficiencies: number[];
  maxEfficiency: number;
  combinations: Record<string, { years: number[] }>;
}

/** Strictly lower ratios only: equal results are never counted as worse. */
export function getStrategyInsights(strategy: VacationOpportunity, data: Record<string, StrategyReference> = referenceData) {
  const reference = data[strategy.periodName ?? ''];
  if (!reference?.efficiencies.length || strategy.daysToTake <= 0) return null;
  const efficiency = Number((strategy.freeDays / strategy.daysToTake).toFixed(2));
  const betterThanPercent = Math.floor(100 * reference.efficiencies.filter(value => value < efficiency - .001).length / reference.efficiencies.length);
  const isBest = efficiency >= reference.maxEfficiency - .001;
  // Reference years describe the start of a break. Christmas next December
  // remains a future opportunity even when this break ends in January.
  const afterYear = strategy.startDate.getFullYear();
  const bestYears = Object.entries(reference.combinations)
    .filter(([key]) => Math.abs(Number(key.split('_')[0]) - reference.maxEfficiency) < .001)
    .flatMap(([, combination]) => combination.years)
    .filter(year => year > afterYear);
  return {
    betterThanPercent, isBest, efficiency, maxEfficiency: reference.maxEfficiency,
    nextBestYear: bestYears.length ? Math.min(...bestYears) : null,
    sampleCount: reference.efficiencies.length,
  };
}
