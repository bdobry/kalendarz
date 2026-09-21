import { formatDateKey, getPolishHolidays } from './dateUtils';
import { YEAR_MAX } from './seo';

export interface UpcomingBreak {
  start: Date;
  end: Date;
  days: number;
  leave: Date | null;
}

/** Upcoming complete breaks for a Monday–Friday schedule, without Saturday redemption. */
export function getUpcomingBreaks(fromDate: string): { natural?: UpcomingBreak; bridge?: UpcomingBreak } {
  const [year, month, day] = fromDate.split('-').map(Number);
  const first = new Date(year, month - 1, day, 12);
  const last = new Date(Math.min(year + 1, YEAR_MAX), 11, 31, 12);
  if (year > YEAR_MAX || !Number.isFinite(first.getTime())) return {};
  const holidays = new Map([...getPolishHolidays(year - 1), ...getPolishHolidays(year), ...getPolishHolidays(Math.min(year + 1, YEAR_MAX))]);
  const offset = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
  const isFree = (date: Date) => date.getDay() === 0 || date.getDay() === 6 || holidays.has(formatDateKey(date));
  const result: { natural?: UpcomingBreak; bridge?: UpcomingBreak } = {};

  for (let start = first; start <= last; start = offset(start, 1)) {
    // A break which has already started is not a new opportunity to plan.
    if (!isFree(start) || isFree(offset(start, -1))) continue;
    let end = start, days = 1;
    while (offset(end, 1) <= last && isFree(offset(end, 1))) { end = offset(end, 1); days++; }
    if (!result.natural && days >= 3) result.natural = { start, end, days, leave: null };

    const leave = offset(end, 1), afterLeave = offset(end, 2);
    if (!result.bridge && afterLeave <= last && isFree(afterLeave)) {
      let bridgeEnd = afterLeave, bridgeDays = days + 2;
      while (offset(bridgeEnd, 1) <= last && isFree(offset(bridgeEnd, 1))) { bridgeEnd = offset(bridgeEnd, 1); bridgeDays++; }
      const hasHoliday = [...holidays.keys()].some(key => key >= formatDateKey(start) && key <= formatDateKey(bridgeEnd));
      if (hasHoliday) result.bridge = { start, end: bridgeEnd, days: bridgeDays, leave };
    }
    if (result.natural && result.bridge) break;
  }
  return result;
}
