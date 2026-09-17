import { describe, expect, it } from 'vitest';
import { assertDonationPlan, bloodLimit, earliestDonationDate, donationCandidateIssue, donationIssues, donationWindow, requiredGap, yearBefore } from './donationRules';
import { emptyPlan, mergePlans, parsePlan, shiftDay, type Donation } from './personalPlan';
const blood = (date: string): Donation => ({ date, type: 'blood' });
const plasma = (date: string): Donation => ({ date, type: 'plasma' });

describe('donation restrictions — annex 3, Dz.U. 2025/756', () => {
  it.each([
    ['blood', 'blood', 55], ['blood', 'plasma', 27], ['plasma', 'plasma', 13], ['plasma', 'blood', 3],
  ] as const)('enforces the date boundary for %s → %s', (previous, next, gap) => {
    const first = { date: '2026-01-10', type: previous };
    expect(requiredGap(previous, next)).toBe(gap);
    expect(donationIssues([first, { date: shiftDay(first.date, gap - 1), type: next }])).not.toEqual([]);
    expect(donationIssues([first, { date: shiftDay(first.date, gap), type: next }])).toEqual([]);
  });
  it('does not reset the whole-blood interval after an intervening plasma donation', () => {
    expect(donationIssues([blood('2026-01-01'), plasma('2026-01-28'), blood('2026-01-31')])[0].message).toContain('8 tygodni');
  });
  it('guarantees the 48-hour floor even when daylight saving shortens a date-only interval', () => {
    expect(earliestDonationDate(plasma('2026-03-27'), 'blood')).toBe('2026-03-31');
    expect(donationIssues([plasma('2026-03-27'), blood('2026-03-30')])).not.toEqual([]);
    expect(donationIssues([plasma('2026-03-27'), blood('2026-03-31')])).toEqual([]);
    expect(earliestDonationDate(plasma('2026-10-23'), 'blood')).toBe('2026-10-26');
  });
  it('counts all blood donations in rolling 12 months across New Year', () => {
    const dates = ['2025-06-01', '2025-07-26', '2025-09-19', '2025-11-13', '2026-01-07'].map(blood);
    expect(donationIssues(dates, 'female')[0].message).toContain('limit 4');
    expect(donationIssues(dates, 'male')).toEqual([]);
    const seventh = Array.from({ length: 7 }, (_, i) => blood(shiftDay('2025-06-01', 55 * i)));
    expect(donationIssues(seventh, 'male')[0].message).toContain('limit 6');
    expect(bloodLimit()).toBe(4);
  });
  it('enforces plasma count as well as spacing', () => {
    const tooMany = Array.from({ length: 34 }, (_, i) => plasma(shiftDay('2026-01-01', i)));
    expect(donationIssues(tooMany).some(i => i.message.includes('limit 33'))).toBe(true);
  });
  it('checks later entries when inserting into the past or moving a donation', () => {
    const plan = { ...emptyPlan(), donations: [blood('2026-03-01')] };
    expect(donationCandidateIssue(plan, blood('2026-02-01'))).toContain('za wcześnie');
    expect(donationCandidateIssue(plan, blood('2026-04-01'), '2026-03-01')).toBeUndefined();
  });
  it('rejects duplicate dates and invalid merged backups even when each file is valid', () => {
    const a = { ...emptyPlan(), donations: [blood('2026-01-01')] };
    const b = { ...emptyPlan(), donations: [blood('2026-01-20')] };
    expect(donationCandidateIssue(a, plasma('2026-01-01'))).toContain('już');
    expect(() => assertDonationPlan(mergePlans(a, b))).toThrow('za wcześnie');
  });
  it('uses calendar anniversaries, including leap years, not calendar-year counters', () => {
    expect(yearBefore('2028-02-29')).toBe('2027-02-28');
    const dates = [blood('2025-06-01'), blood('2025-08-01'), blood('2026-05-01')];
    expect(donationWindow(dates, '2026-06-01', 'blood')).toBe(2);
    expect(donationWindow(dates, '2026-05-31', 'blood')).toBe(3);
  });
  it('preserves legacy entries for repair and migrates the missing profile conservatively', () => {
    const legacy: any = { ...emptyPlan(), donations: [blood('2026-01-01'), blood('2026-01-02')] };
    delete legacy.donorProfile;
    const loaded = parsePlan(JSON.stringify(legacy));
    expect(loaded.donorProfile).toBe('unspecified');
    expect(loaded.donations).toHaveLength(2);
    expect(() => assertDonationPlan(loaded)).toThrow();
    expect(() => parsePlan(JSON.stringify({ ...legacy, donorProfile: 'unlimited' }))).toThrow();
  });
});
