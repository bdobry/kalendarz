import { formatDateKey, getPolishHolidays } from './dateUtils';
import type { DonorProfile } from './donationRules';

export const PLAN_KEY = 'nierobie.personal-plan.v1';
export const PLAN_MIN_YEAR = 2024;
export const PLAN_MAX_YEAR = 2099;
export const REGIONS = ['dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie', 'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie', 'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie', 'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie'] as const;
export interface Donation { date: string; type: 'blood' | 'plasma' }
export interface PersonalPlan {
  version: 1;
  leave: string[];
  donations: Donation[];
  donorProfile?: DonorProfile;
  budgets: Record<string, number>;
  school: { enabled: boolean; region: string };
}
export const emptyPlan = (): PersonalPlan => ({ version: 1, leave: [], donations: [], donorProfile: 'unspecified', budgets: {}, school: { enabled: false, region: 'mazowieckie' } });
export const civilDate = (key: string) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const shiftDay = (key: string, days: number) => { const d = civilDate(key); d.setDate(d.getDate() + days); return formatDateKey(d); };
export function validPlanDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number(value.slice(0, 4)) >= PLAN_MIN_YEAR && Number(value.slice(0, 4)) <= PLAN_MAX_YEAR && formatDateKey(civilDate(value)) === value;
}
const holidayCache = new Map<number, Map<string, string>>();
export function holidayOn(key: string) {
  const year = Number(key.slice(0, 4));
  if (!holidayCache.has(year)) holidayCache.set(year, getPolishHolidays(year));
  return holidayCache.get(year)!.get(key);
}
export function isWorkday(key: string) {
  const day = civilDate(key).getDay();
  return day !== 0 && day !== 6 && !holidayOn(key);
}
export function parsePlan(raw: string): PersonalPlan {
  if (raw.length > 500_000) throw new Error('Plik planu jest za duży (maks. 500 kB).');
  let value: any;
  try { value = JSON.parse(raw); } catch { throw new Error('Nie udało się odczytać planu. Wybierz kopię JSON pobraną z planera.'); }
  const invalid = () => { throw new Error('Nieprawidłowy lub nieobsługiwany format planu. Oryginalny zapis pozostaje bez zmian.'); };
  if (!value || value.version !== 1 || !Array.isArray(value.leave) || !Array.isArray(value.donations) || !value.budgets || typeof value.budgets !== 'object' || Array.isArray(value.budgets) || typeof value.school?.enabled !== 'boolean' || !REGIONS.includes(value.school.region)) return invalid();
  if (value.leave.length > 28000 || value.donations.length > 28000 || !value.leave.every(validPlanDate)) return invalid();
  if (!value.donations.every((d: any) => d && validPlanDate(d.date) && ['blood', 'plasma'].includes(d.type))) return invalid();
  if (new Set(value.donations.map((d: Donation) => d.date)).size !== value.donations.length) return invalid();
  if (value.donorProfile !== undefined && !['unspecified', 'female', 'male'].includes(value.donorProfile)) return invalid();
  for (const [year, budget] of Object.entries(value.budgets)) {
    if (!/^\d{4}$/.test(year) || +year < PLAN_MIN_YEAR || +year > PLAN_MAX_YEAR || !Number.isInteger(budget) || Number(budget) < 0 || Number(budget) > 366) return invalid();
  }
  return { version: 1, donorProfile: value.donorProfile ?? 'unspecified', leave: [...new Set<string>(value.leave)].filter(isWorkday).sort(), donations: value.donations.map(({ date, type }: Donation) => ({ date, type })).sort((a: Donation, b: Donation) => a.date.localeCompare(b.date)), budgets: { ...value.budgets }, school: { enabled: value.school.enabled, region: value.school.region } };
}
export function mergePlans(current: PersonalPlan, incoming: PersonalPlan): PersonalPlan {
  const donations = new Map(incoming.donations.map(d => [d.date, d]));
  current.donations.forEach(d => donations.set(d.date, d));
  return { ...current, donorProfile: current.donorProfile && current.donorProfile !== 'unspecified' ? current.donorProfile : incoming.donorProfile ?? 'unspecified', leave: [...new Set([...current.leave, ...incoming.leave])].sort(), donations: [...donations.values()].sort((a, b) => a.date.localeCompare(b.date)), budgets: { ...incoming.budgets, ...current.budgets } };
}
export function donationDays(plan: PersonalPlan) {
  const dates = new Set<string>();
  plan.donations.forEach(d => { dates.add(d.date); dates.add(shiftDay(d.date, 1)); });
  return dates;
}
export interface PlanBreak {
  start: string; end: string; days: number; leave: number; donation: number;
  byYear: Record<string, { leave: number; donation: number }>;
}
export function analyzePlan(plan: PersonalPlan, year: number) {
  const donated = donationDays(plan), selected = new Set(plan.leave);
  const free = (key: string) => !isWorkday(key) || selected.has(key) || donated.has(key);
  const first = `${year}-01-01`, last = `${year}-12-31`;
  let start = first, end = last;
  // Extend through selected days in adjacent years as well as natural days off.
  while (free(shiftDay(start, -1))) start = shiftDay(start, -1);
  while (free(shiftDay(end, 1))) end = shiftDay(end, 1);
  const breaks: PlanBreak[] = [];
  let current: PlanBreak | null = null;
  let selectedInYear = false;
  const finish = () => { if (current && selectedInYear) breaks.push(current); current = null; selectedInYear = false; };
  for (let key = start; key <= end; key = shiftDay(key, 1)) {
    if (!free(key)) { finish(); continue; }
    current ??= { start: key, end: key, days: 0, leave: 0, donation: 0, byYear: {} };
    current.end = key; current.days++;
    if (isWorkday(key)) {
      if (donated.has(key) || selected.has(key)) {
        const costs = current.byYear[key.slice(0, 4)] ??= { leave: 0, donation: 0 };
        if (donated.has(key)) { current.donation++; costs.donation++; }
        else { current.leave++; costs.leave++; }
      }
    }
    if (key >= first && key <= last && (selected.has(key) || donated.has(key))) selectedInYear = true;
  }
  finish();
  const used = plan.leave.filter(key => key.startsWith(`${year}-`) && !donated.has(key) && isWorkday(key)).length;
  const donationWorkdays = [...donated].filter(key => key.startsWith(`${year}-`) && isWorkday(key)).length;
  const overlap = plan.leave.filter(key => key.startsWith(`${year}-`) && donated.has(key)).length;
  return { breaks, used, donationWorkdays, overlap, longest: Math.max(0, ...breaks.map(b => b.days)), total: breaks.reduce((sum, b) => sum + b.days, 0), donated };
}
export function plannerHref(year: number, dates: string[] = []) {
  const safeYear = Math.min(PLAN_MAX_YEAR, Math.max(PLAN_MIN_YEAR, year));
  // Fragment stays in the browser; selected dates do not enter server logs/referrers.
  const params = new URLSearchParams({ rok: String(safeYear) });
  const valid = [...new Set(dates.filter(validPlanDate))].filter(isWorkday).sort();
  if (valid.length) { params.set('dni', valid.join(',')); params.set('rok', valid[0].slice(0, 4)); }
  return `/kalkulator-urlopu/#${params}`;
}
export function parsePlannerHash(hash: string, fallbackYear: number) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const year = Number(params.get('rok'));
  const safeYear = Number.isInteger(year) && year >= PLAN_MIN_YEAR && year <= PLAN_MAX_YEAR ? year : Math.min(PLAN_MAX_YEAR, Math.max(PLAN_MIN_YEAR, fallbackYear));
  const dates = (params.get('dni') || '').split(',');
  const valid = dates.length <= 366 && dates.every(validPlanDate) ? [...new Set(dates)].filter(isWorkday).sort() : [];
  return { year: valid.length ? Number(valid[0].slice(0, 4)) : safeYear, dates: valid };
}
export function leaveInRange(start: string, end: string) {
  if (!validPlanDate(start) || !validPlanDate(end) || end < start) throw new Error('Wybierz poprawny początek i koniec zakresu.');
  const result: string[] = [];
  let count = 0;
  for (let key = start; key <= end; key = shiftDay(key, 1)) {
    if (++count > 366) throw new Error('Jeden zakres może mieć maksymalnie 366 dni.');
    if (isWorkday(key)) result.push(key);
  }
  return result;
}
export const displayDate = (key: string) => civilDate(key).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
export const displayRange = (start: string, end: string) => start.slice(0, 4) !== end.slice(0, 4)
  ? `${displayDate(start)} ${start.slice(0, 4)} – ${displayDate(end)} ${end.slice(0, 4)}`
  : `${displayDate(start)} – ${displayDate(end)}`;
