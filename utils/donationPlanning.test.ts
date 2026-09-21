import { describe, expect, it } from 'vitest';
import { nextDonationSlot } from './donationPlanning';
import { donationCandidateIssue } from './donationRules';
import { emptyPlan, shiftDay, type Donation } from './personalPlan';

const blood = (date: string): Donation => ({ date, type: 'blood' });
const plasma = (date: string): Donation => ({ date, type: 'plasma' });

describe('next entry in the donation plan', () => {
  it('starts with the caller’s lower bound and never suggests an occupied date', () => {
    expect(nextDonationSlot(emptyPlan(), 'blood', '2026-09-21')).toEqual({ status: 'available', date: '2026-09-21' });
    const plan = { ...emptyPlan(), donations: [plasma('2026-09-21')] };
    expect(nextDonationSlot(plan, 'blood', '2026-09-21')).toEqual({ status: 'available', date: '2026-09-24' });
  });

  it('considers previous donations of both types, not just the latest entry', () => {
    const plan = { ...emptyPlan(), donations: [blood('2026-01-01'), plasma('2026-01-28')] };
    expect(nextDonationSlot(plan, 'blood', '2026-01-31')).toEqual({ status: 'available', date: '2026-02-25' });
  });

  it('protects later planned appointments when choosing a gap', () => {
    const plan = { ...emptyPlan(), donations: [blood('2026-10-01')] };
    const result = nextDonationSlot(plan, 'blood', '2026-09-21');
    expect(result).toEqual({ status: 'available', date: '2026-11-25' });
    expect(donationCandidateIssue(plan, blood(result.date!))).toBeUndefined();
  });

  it('waits for a rolling annual limit across years and respects the selected profile', () => {
    const plan = { ...emptyPlan(), donations: ['2025-10-01', '2025-12-01', '2026-02-01', '2026-04-01'].map(blood) };
    expect(nextDonationSlot(plan, 'blood', '2026-09-21')).toEqual({ status: 'available', date: '2026-10-01' });
    expect(nextDonationSlot({ ...plan, donorProfile: 'male' }, 'blood', '2026-09-21')).toEqual({ status: 'available', date: '2026-09-21' });
  });

  it('does not increase a later rolling total above the allowed limit', () => {
    const plan = { ...emptyPlan(), donations: ['2026-01-01', '2026-03-01', '2026-05-01', '2026-12-01'].map(blood) };
    // September would fit the preceding gap but invalidate the December entry.
    expect(nextDonationSlot(plan, 'blood', '2026-09-01')).toEqual({ status: 'out-of-range', date: null });
  });

  it('keeps the date-only DST protection from the shared validation engine', () => {
    const plan = { ...emptyPlan(), donations: [plasma('2026-03-27')] };
    expect(nextDonationSlot(plan, 'blood', '2026-03-28')).toEqual({ status: 'available', date: '2026-03-31' });
  });

  it('asks for repair instead of suggesting dates for an inconsistent saved plan', () => {
    const plan = { ...emptyPlan(), donations: [blood('2026-01-01'), blood('2026-01-02')] };
    expect(nextDonationSlot(plan, 'plasma', '2026-09-21')).toEqual({ status: 'conflict', date: null, issue: expect.stringContaining('za wcześnie') });
  });

  it('stays within the selected range and supported calendar years', () => {
    const plan = { ...emptyPlan(), donations: [blood('2099-12-01')] };
    expect(nextDonationSlot(plan, 'blood', '2099-12-02')).toEqual({ status: 'out-of-range', date: null });
    for (const [start, end] of [['2026-09-21', '2025-12-31'], ['2026-02-30', '2026-12-31'], ['2100-01-01', '2100-12-31']]) {
      expect(nextDonationSlot(emptyPlan(), 'plasma', start, end)).toEqual({ status: 'out-of-range', date: null });
    }
    expect(nextDonationSlot(emptyPlan(), 'blood', '2099-12-31')).toEqual({ status: 'available', date: '2099-12-31' });
  });

  it('returns the first valid candidate without changing the saved plan', () => {
    const plan = { ...emptyPlan(), donations: [blood('2026-01-01'), plasma('2026-03-01')] };
    const snapshot = JSON.stringify(plan);
    const from = '2026-02-01';
    const result = nextDonationSlot(plan, 'plasma', from);
    expect(result.status).toBe('available');
    if (result.status !== 'available') return;
    expect(donationCandidateIssue(plan, plasma(result.date))).toBeUndefined();
    for (let date = from; date < result.date; date = shiftDay(date, 1)) expect(donationCandidateIssue(plan, plasma(date))).toBeTruthy();
    expect(JSON.stringify(plan)).toBe(snapshot);
  });
});
