import { shiftDay, type Donation, type PersonalPlan } from './personalPlan';

// Dz.U. 2025 poz. 756, annex 3 (verified 2026-09-16).
// Rows in the statutory table are CURRENT donations, columns PREVIOUS donations.
export const DONATION_RULES_SOURCE = 'https://eli.gov.pl/eli/DU/2025/756/ogl';
export type DonorProfile = 'unspecified' | 'female' | 'male';
export const bloodLimit = (profile: DonorProfile = 'unspecified') => profile === 'male' ? 6 : 4;
export interface DonationIssue { dates: string[]; message: string }
const name = (type: Donation['type']) => type === 'blood' ? 'krwi' : 'osocza';
const fullDate = (key: string) => key.split('-').reverse().join('.');
const warsawClock = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Warsaw', timeZoneName: 'longOffset' });
function warsawOffset(date: string, endOfDay: boolean) {
  const offset = warsawClock.formatToParts(new Date(`${date}T${endOfDay ? '21:59:59' : '00:00:00'}Z`)).find(part => part.type === 'timeZoneName')!.value;
  const [, sign, hours, minutes] = /GMT([+-])(\d{2}):(\d{2})/.exec(offset)!;
  return (sign === '+' ? 1 : -1) * (+hours * 60 + +minutes) * 60_000;
}
export function earliestDonationDate(previous: Donation, next: Donation['type']) {
  let earliest = shiftDay(previous.date, requiredGap(previous.type, next));
  if (previous.type === 'plasma' && next === 'blood') {
    const latestPreviousInstant = Date.parse(`${previous.date}T23:59:59.999Z`) - warsawOffset(previous.date, true);
    const earliestNextInstant = Date.parse(`${earliest}T00:00:00Z`) - warsawOffset(earliest, false);
    // A spring DST transition can make a three-date gap shorter than 48 elapsed hours.
    if (earliestNextInstant - latestPreviousInstant < 48 * 3_600_000) earliest = shiftDay(earliest, 1);
  }
  return earliest;
}

/** Calendar anniversary with Feb 29 clamped to Feb 28 in a non-leap year. */
export function yearBefore(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year - 1, month, 0)).getUTCDate();
  return `${year - 1}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}
export function donationWindow(donations: Donation[], at: string, type: Donation['type']) {
  const start = yearBefore(at);
  return donations.filter(d => d.type === type && d.date > start && d.date <= at).length;
}
export function requiredGap(previous: Donation['type'], next: Donation['type']) {
  // The statutory week-based periods include the collection day: 56/28/14 days inclusive.
  // Dates alone cannot guarantee 48 elapsed hours (also across DST). Use 3 civil days
  // after plasma before blood; the UI explicitly explains this conservative rounding.
  return previous === 'blood' ? (next === 'blood' ? 55 : 27) : (next === 'plasma' ? 13 : 3);
}
export function donationIssues(donations: Donation[], profile: DonorProfile = 'unspecified'): DonationIssue[] {
  const sorted = [...donations].sort((a, b) => a.date.localeCompare(b.date));
  const issues: DonationIssue[] = [];
  const latest: Partial<Record<Donation['type'], Donation>> = {};
  const windows: Record<Donation['type'], Donation[]> = { blood: [], plasma: [] };
  for (const current of sorted) {
    // Check both previous types, not only the immediately preceding donation.
    for (const previous of Object.values(latest)) {
      const earliest = earliestDonationDate(previous, current.type);
      if (current.date < earliest) {
        const explanation = previous.type === 'plasma' && current.type === 'blood'
          ? 'Po osoczu wymagane jest 48 godzin. Bez zapisu godziny planer zostawia co najmniej 3 dni (4 przy skróceniu doby).'
          : `Między tymi donacjami wymagane jest ${previous.type === 'blood' ? (current.type === 'blood' ? '8 tygodni' : '4 tygodnie') : '2 tygodnie'} (z dniem pobrania).`;
        issues.push({ dates: [previous.date, current.date], message: `${fullDate(current.date)}: za wcześnie na oddanie ${name(current.type)} po ${fullDate(previous.date)}. ${explanation} Najwcześniejsza data wynikająca z tej przerwy: ${fullDate(earliest)}.` });
      }
    }
    const type = current.type, cutoff = yearBefore(current.date);
    windows[type] = windows[type].filter(d => d.date > cutoff);
    windows[type].push(current);
    const limit = type === 'blood' ? bloodLimit(profile) : 33;
    if (windows[type].length > limit) issues.push({ dates: windows[type].map(d => d.date), message: `${fullDate(current.date)}: przekroczony limit ${limit} donacji ${name(type)} w 12 kolejnych miesiącach. Styczeń nie zeruje tego limitu.${profile === 'unspecified' && type === 'blood' ? ' Bez wybranego profilu stosujemy limit 4 donacji.' : ''}` });
    latest[current.type] = current;
  }
  return issues;
}
export function donationCandidateIssue(plan: PersonalPlan, candidate: Donation, replacingDate?: string) {
  const others = plan.donations.filter(d => d.date !== replacingDate);
  if (others.some(d => d.date === candidate.date)) return 'W tym dniu masz już zapisaną donację.';
  return donationIssues([...others, candidate], plan.donorProfile)[0]?.message;
}
export function assertDonationPlan(plan: PersonalPlan) {
  const issue = donationIssues(plan.donations, plan.donorProfile)[0];
  if (issue) throw new Error(issue.message);
}
