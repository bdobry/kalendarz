import { getPolishHolidays } from './dateUtils';
import { YEAR_MAX } from './seo';

export const CALCULATOR_MIN_YEAR = 2024;

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Wybierz poprawną datę początku i końca.');
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  if (year < CALCULATOR_MIN_YEAR || year > YEAR_MAX || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error(`Wybierz poprawne daty z lat ${CALCULATOR_MIN_YEAR}–${YEAR_MAX}.`);
  return date;
}
export function calculateLeave(start: string, end: string) {
  const first = parseDate(start), last = parseDate(end);
  if (first > last) throw new Error('Data końca nie może być wcześniejsza niż data początku.');
  const holidaysByYear = new Map<number, Map<string, string>>();
  let totalDays = 0, leaveDays = 0, weekends = 0, holidaysOnWeekdays = 0;
  for (const d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    if (++totalDays > 366) throw new Error('Wybierz okres nie dłuższy niż 366 dni.');
    const year = d.getFullYear();
    if (!holidaysByYear.has(year)) holidaysByYear.set(year, getPolishHolidays(year));
    const key = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (d.getDay() === 0 || d.getDay() === 6) weekends++;
    else if (holidaysByYear.get(year)!.has(key)) holidaysOnWeekdays++;
    else leaveDays++;
  }
  return { totalDays, leaveDays, weekends, holidaysOnWeekdays };
}
