import { donationDays, shiftDay, type PersonalPlan } from './personalPlan';

/** All-day civil dates avoid timezone shifts when importing into other calendars. */
export function plannerIcs(plan: PersonalPlan, year: number, workspace: 'leave' | 'donations', timestamp = new Date().toISOString()) {
  const donated = donationDays(plan);
  const events = workspace === 'leave'
    ? plan.leave.filter(date => date.startsWith(`${year}-`) && !donated.has(date)).map(date => ({ date, end: shiftDay(date, 1), summary: 'Urlop', kind: 'leave' }))
    : plan.donations.filter(d => d.date.startsWith(`${year}-`)).map(d => ({ date: d.date, end: shiftDay(d.date, 2), summary: d.type === 'blood' ? 'Donacja krwi i dzień po' : 'Donacja osocza i dzień po', kind: d.type }));
  const compact = (date: string) => date.replaceAll('-', '');
  const stamp = timestamp.replace(/[-:]/g, '').split('.')[0] + (timestamp.includes('.') ? 'Z' : '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//nierobie.pl//Planer//PL', 'CALSCALE:GREGORIAN', ...events.flatMap(event => [
    'BEGIN:VEVENT', `UID:${event.kind}-${event.date}@nierobie.pl`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(event.date)}`, `DTEND;VALUE=DATE:${compact(event.end)}`, `SUMMARY:${event.summary}`, 'END:VEVENT'
  ]), 'END:VCALENDAR', ''].join('\r\n');
}

export function downloadPlannerFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; document.body.appendChild(link);
  link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
