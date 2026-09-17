import { describe, expect, it } from 'vitest';
import { analyzePlan, emptyPlan, leaveInRange, mergePlans, parsePlan, parsePlannerHash, plannerHref, shiftDay } from './personalPlan';

describe('personal leave plan', () => {
  it('merges overlapping bridges and counts every day once', () => {
    const plan = { ...emptyPlan(), leave: ['2026-01-02', '2026-01-05'] };
    const result = analyzePlan(plan, 2026);
    expect(result.used).toBe(2);
    expect(result.total).toBe(6);
    expect(result.breaks).toEqual([{ start: '2026-01-01', end: '2026-01-06', days: 6, leave: 2, donation: 0, byYear: { '2026': { leave: 2, donation: 0 } } }]);
    expect(analyzePlan(emptyPlan(), 2026).total).toBe(0);
  });
  it('sums separate breaks but shows their longest run separately', () => {
    const result = analyzePlan({ ...emptyPlan(), leave: ['2026-01-02', '2026-06-05'] }, 2026);
    expect(result.breaks).toHaveLength(2);
    expect(result.total).toBe(8);
    expect(result.longest).toBe(4);
  });
  it('extends across years while charging the right annual budgets', () => {
    const plan = { ...emptyPlan(), leave: leaveInRange('2026-12-28', '2027-01-05') };
    const result = analyzePlan(plan, 2026);
    expect(result.used).toBe(4);
    expect(analyzePlan(plan, 2027).used).toBe(2);
    expect(analyzePlan(plan, 2027).breaks).toEqual(result.breaks);
    expect(result.breaks[0]).toEqual({ start: '2026-12-24', end: '2027-01-06', days: 14, leave: 6, donation: 0, byYear: { '2026': { leave: 4, donation: 0 }, '2027': { leave: 2, donation: 0 } } });
  });
  it('does not move Friday donation release to Monday', () => {
    const plan = emptyPlan(); plan.donations = [{ date: '2026-09-18', type: 'blood' }];
    const result = analyzePlan(plan, 2026);
    expect(result.used).toBe(0);
    expect(result.donationWorkdays).toBe(1);
    expect(result.total).toBe(3);
    expect([...result.donated]).toEqual(['2026-09-18', '2026-09-19']);
  });
  it('counts plasma and overlapping leave once, restoring leave after removal', () => {
    const plan = emptyPlan(); plan.leave = ['2026-09-17', '2026-09-18'];
    plan.donations = [{ date: '2026-09-17', type: 'plasma' }, { date: '2026-09-18', type: 'blood' }];
    const result = analyzePlan(plan, 2026);
    expect(result).toMatchObject({ used: 0, donationWorkdays: 2, overlap: 2, total: 4 });
    expect(analyzePlan({ ...plan, donations: [] }, 2026).used).toBe(2);
  });
  it('keeps the next donation day in the next calendar year', () => {
    const plan = emptyPlan(); plan.donations = [{ date: '2026-12-31', type: 'blood' }];
    expect(analyzePlan(plan, 2026).donationWorkdays).toBe(1);
    expect(analyzePlan(plan, 2027).donationWorkdays).toBe(0); // New Year already free.
    expect(analyzePlan(plan, 2026).breaks[0].end).toBe('2027-01-03');
  });
  it('splits a cross-year break by budget without double charging donation overlaps', () => {
    const plan = { ...emptyPlan(), leave: leaveInRange('2026-12-28', '2027-01-05') };
    plan.donations = [{ date: '2026-12-31', type: 'blood' }];
    const previous = analyzePlan(plan, 2026), next = analyzePlan(plan, 2027);
    expect(previous).toMatchObject({ used: 3, donationWorkdays: 1, overlap: 1, total: 14 });
    expect(next).toMatchObject({ used: 2, donationWorkdays: 0, overlap: 0, total: 14 });
    expect(previous.breaks[0].byYear).toEqual({ '2026': { leave: 3, donation: 1 }, '2027': { leave: 2, donation: 0 } });
    expect(next.breaks).toEqual(previous.breaks);
    expect(analyzePlan({ ...plan, donations: [] }, 2026).used).toBe(4);
  });
  it('school overlay does not consume or grant leave', () => {
    const plan = { ...emptyPlan(), school: { enabled: true, region: 'mazowieckie' } };
    expect(analyzePlan(plan, 2026)).toEqual(analyzePlan(emptyPlan(), 2026));
  });
  it('extends the earliest supported year into the full preceding weekend', () => {
    const plan = { ...emptyPlan(), leave: ['2024-01-02'] };
    expect(analyzePlan(plan, 2024).breaks[0]).toMatchObject({ start: '2023-12-30', days: 4 });
  });
  it('uses civil dates across leap days and DST changes', () => {
    expect(shiftDay('2028-02-28', 1)).toBe('2028-02-29');
    expect(shiftDay('2026-03-29', 1)).toBe('2026-03-30');
    expect(leaveInRange('2026-04-27', '2026-05-03')).toHaveLength(4);
    expect(() => leaveInRange('2026-02-30', '2026-03-01')).toThrow();
    expect(() => leaveInRange('2026-01-01', '2027-12-31')).toThrow();
  });
  it('round-trips valid backups, rejects corruption, deduplicates leave and preserves existing data on merge', () => {
    const plan = emptyPlan(); plan.leave = ['2026-01-02', '2026-01-02', '2026-01-03']; plan.budgets = { '2026': 20 };
    expect(parsePlan(JSON.stringify(plan)).leave).toEqual(['2026-01-02']);
    for (const changed of [{ version: 2 }, { leave: ['2026-02-30'] }, { budgets: { '2026': -1 } }, { school: { enabled: true, region: 'unknown' } }, { donations: [{ date: '2026-01-02', type: 'other' }] }]) expect(() => parsePlan(JSON.stringify({ ...plan, ...changed }))).toThrow();
    expect(() => parsePlan('{')).toThrow();
    const incoming = emptyPlan(); incoming.leave = ['2027-01-04']; incoming.budgets = { '2026': 26, '2027': 20 };
    expect(mergePlans(parsePlan(JSON.stringify(plan)), incoming)).toMatchObject({ leave: ['2026-01-02', '2027-01-04'], budgets: { '2026': 20, '2027': 20 } });
  });
  it('bounds untrusted deep links and keeps cross-year strategy dates', () => {
    const href = plannerHref(2026, ['2026-12-31', '2027-01-04', 'garbage']);
    expect(href).not.toContain('?');
    expect(parsePlannerHash(href.split('#')[1], 2026)).toEqual({ year: 2026, dates: ['2026-12-31', '2027-01-04'] });
    expect(parsePlannerHash('#rok=banana&dni=2026-02-30', 2027)).toEqual({ year: 2027, dates: [] });
  });
});
