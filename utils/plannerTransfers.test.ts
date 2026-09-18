import { describe, expect, it } from 'vitest';
import { emptyPlan } from './personalPlan';
import { plannerIcs } from './plannerTransfers';

const timestamp = '2026-09-18T10:00:00.000Z';

describe('planner calendar export', () => {
  it('exports only leave charged in the chosen year and never leaks donation details', () => {
    const plan = { ...emptyPlan(), leave: ['2026-09-17', '2026-09-18', '2026-09-21', '2027-01-04'], donations: [{ date: '2026-09-17', type: 'plasma' as const }] };
    const ics = plannerIcs(plan, 2026, 'leave', timestamp);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260921\r\nDTEND;VALUE=DATE:20260922');
    expect(ics).toContain('SUMMARY:Urlop');
    expect(ics).not.toMatch(/Donacja|plasma|2027/);
    expect(ics).toContain('DTSTAMP:20260918T100000Z');
    expect(ics).toMatch(/END:VCALENDAR\r\n$/);
  });

  it('keeps a donation and its following calendar day across a year boundary', () => {
    const plan = { ...emptyPlan(), leave: ['2026-12-28'], donations: [{ date: '2026-12-31', type: 'blood' as const }, { date: '2027-03-01', type: 'plasma' as const }] };
    const ics = plannerIcs(plan, 2026, 'donations', timestamp);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270102');
    expect(ics).toContain('SUMMARY:Donacja krwi i dzień po');
    expect(ics).not.toContain('SUMMARY:Urlop');
    expect(ics).not.toContain('20270301');
  });

  it('uses a stable event identity across repeated exports and supports an empty plan', () => {
    const plan = { ...emptyPlan(), leave: ['2026-10-23'] };
    const uid = (ics: string) => ics.match(/UID:[^\r]+/)?.[0];
    expect(uid(plannerIcs(plan, 2026, 'leave', timestamp))).toBe(uid(plannerIcs(plan, 2026, 'leave', '2026-10-01T00:00:00.000Z')));
    expect(plannerIcs(emptyPlan(), 2026, 'leave', timestamp)).not.toContain('BEGIN:VEVENT');
  });
});
