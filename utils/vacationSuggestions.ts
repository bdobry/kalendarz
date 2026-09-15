import { formatDateKey, getPolishHolidays } from './dateUtils';
import { type VacationOpportunity } from './vacationStrategyUtils';
import { YEAR_MAX } from './seo';

/** The calendar's reference date is always the civil date in Poland. */
export function getPlanningDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function rankVacationSuggestions(strategies: VacationOpportunity[], year: number, fromDate: string, maxLeave: number, limit = 3): VacationOpportunity[] {
  const ranked = strategies.filter(s => s.daysToTake > 0 && s.daysToTake <= maxLeave && s.freeDays >= 3 && s.startDate.getFullYear() === year && formatDateKey(s.startDate) >= fromDate)
    .sort((a, b) => b.freeDays - a.freeDays || a.daysToTake - b.daysToTake || a.startDate.getTime() - b.startDate.getTime());
  const picks: VacationOpportunity[] = [];
  for (const candidate of ranked) {
    // Three genuinely different breaks, rather than three variations of Christmas.
    if (picks.every(pick => formatDateKey(candidate.endDate) < formatDateKey(pick.startDate) || formatDateKey(candidate.startDate) > formatDateKey(pick.endDate))) picks.push(candidate);
    if (picks.length === limit) break;
  }
  return picks;
}

const strategyCache = new Map<number, VacationOpportunity[]>();
export function getVacationCandidates(year: number): VacationOpportunity[] {
  if (strategyCache.has(year)) return strategyCache.get(year)!;
  const holidays = new Map([...getPolishHolidays(year), ...getPolishHolidays(year + 1)]);
  const days: { date: Date; key: string; working: boolean; holiday?: string }[] = [];
  // Ten leave days starting in late December can extend into January.
  const boundary = year === YEAR_MAX ? new Date(year, 11, 31, 12) : new Date(year + 1, 0, 31, 12);
  for (let date = new Date(year, 0, 1, 12); date <= boundary; date.setDate(date.getDate() + 1)) {
    const key = formatDateKey(date), holiday = holidays.get(key);
    days.push({ date: new Date(date), key, holiday, working: date.getDay() !== 0 && date.getDay() !== 6 && !holiday });
  }
  const candidates: VacationOpportunity[] = [];
  for (let start = 0; start < days.length && days[start].date.getFullYear() === year; start++) {
    const vacationDays: Date[] = [];
    const names = new Set<string>();
    for (let end = start; end < days.length; end++) {
      const day = days[end];
      if (day.working) vacationDays.push(day.date);
      if (vacationDays.length > 10) break;
      if (day.holiday) names.add(day.holiday);
      const freeDays = end - start + 1;
      // For a fixed start and leave cost, extend through every following free day.
      // Any shorter end with that same cost is dominated by this interval.
      if (vacationDays.length === 0 || freeDays < 3 || (days[end + 1] && !days[end + 1].working)) continue;
      const holidayNames = [...names];
      const periodName = holidayNames.some(name => name.includes('Święto Pracy') || name.includes('3 Maja')) ? 'Majówka'
        : holidayNames.some(name => name.includes('Boże Ciało')) ? 'Boże Ciało'
        : holidayNames.some(name => name.includes('Boże Narodzenie') || name.includes('Wigilia')) ? 'Boże Narodzenie'
        : holidayNames.some(name => name.includes('Wielkanoc')) ? 'Wielkanoc'
        : holidayNames[0] || 'Czas na przerwę';
      candidates.push({ id: `${days[start].key}_${day.key}`, startDate: days[start].date, endDate: day.date, daysToTake: vacationDays.length, vacationDays: [...vacationDays], freeDays, efficiency: freeDays / vacationDays.length, description: periodName, periodName, monthIndex: vacationDays[0].getMonth() });
    }
  }
  // Bound the cache while prerendering more than a hundred year pages.
  if (strategyCache.size >= 4) strategyCache.delete(strategyCache.keys().next().value!);
  strategyCache.set(year, candidates);
  return candidates;
}

export function getVacationSuggestions(year: number, fromDate: string, maxLeave = 3) {
  return rankVacationSuggestions(getVacationCandidates(year), year, fromDate, maxLeave);
}

/** Distinct holiday breaks worth spending exactly two leave days on. */
export function getTwoDayBreaks(year: number): VacationOpportunity[] {
  const candidates = getVacationCandidates(year).filter(strategy => strategy.daysToTake === 2 && strategy.freeDays >= 5);
  return rankVacationSuggestions(candidates, year, `${year}-01-01`, 2, candidates.length)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export const displayDate = (date: Date) => date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
export const displayRange = (start: Date, end: Date) => `${displayDate(start)} – ${displayDate(end)}`;
export const displayLeaveDates = (dates: Date[]) => dates.map(displayDate).join(', ');
