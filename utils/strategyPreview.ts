import { formatDateKey } from './dateUtils';
import { plannerHref, PLAN_MIN_YEAR, validPlanDate } from './personalPlan';
import type { VacationOpportunity } from './vacationStrategyUtils';
import { getStrategyInsights } from './strategyInsights';

/** One efficient long break, then the strongest distinct holiday periods. */
export function selectStrategyPreview(strategies: VacationOpportunity[], year: number, limit = 3) {
  if (limit <= 0) return [];
  const eligible = strategies.filter(strategy => strategy.startDate.getFullYear() === year && strategy.vacationDays.some(date => date.getFullYear() === year) && (year < PLAN_MIN_YEAR || strategy.vacationDays.every(date => validPlanDate(formatDateKey(date)))));
  const byEfficiency = (a: VacationOpportunity, b: VacationOpportunity) => b.freeDays / b.daysToTake - a.freeDays / a.daysToTake || b.freeDays - a.freeDays || a.startDate.getTime() - b.startDate.getTime();
  const longBreak = eligible.filter(strategy => strategy.freeDays >= 14).sort(byEfficiency)[0];
  const periodWinners = new Map<string, VacationOpportunity>();
  [...eligible].sort(byEfficiency).forEach(strategy => {
    const period = strategy.periodName || strategy.id;
    if (!periodWinners.has(period)) periodWinners.set(period, strategy);
  });
  const ranked = [...periodWinners.values()].sort((a, b) => {
    const aStats = getStrategyInsights(a), bStats = getStrategyInsights(b);
    return Number(bStats?.isBest ?? false) - Number(aStats?.isBest ?? false)
      || (bStats?.betterThanPercent ?? 0) - (aStats?.betterThanPercent ?? 0)
      || byEfficiency(a, b);
  });
  const selected: VacationOpportunity[] = [];
  for (const candidate of [...(longBreak ? [longBreak] : []), ...ranked]) {
    if (selected.some(pick => candidate.startDate <= pick.endDate && candidate.endDate >= pick.startDate)) continue;
    // Different holidays are more useful here than another variant of the same break.
    if (candidate.periodName && selected.some(pick => pick.periodName === candidate.periodName)) continue;
    selected.push(candidate);
    if (selected.length === limit) break;
  }
  return selected;
}

export function strategyPlannerHref(year: number, strategy?: VacationOpportunity) {
  const params = new URLSearchParams(plannerHref(year).split('#')[1]);
  params.set('sekcja', 'strategia');
  if (strategy) params.set('propozycja', strategy.id);
  return `/kalkulator-urlopu/#${params}`;
}

export function strategyDateKeys(strategy: VacationOpportunity) {
  return strategy.vacationDays.map(formatDateKey);
}
