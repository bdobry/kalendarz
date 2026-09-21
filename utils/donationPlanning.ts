import { donationCandidateIssue, donationIssues } from './donationRules';
import { shiftDay, validPlanDate, type Donation, type PersonalPlan } from './personalPlan';

export type DonationSlot =
  | { status: 'available'; date: string }
  | { status: 'conflict'; date: null; issue: string }
  | { status: 'out-of-range'; date: null };

/**
 * First extra entry that fits the saved plan, not a medical eligibility decision.
 * Checks future entries too: inserting a donation must not invalidate a later one.
 * The caller supplies today's/selected year's lower bound, never a past suggestion.
 */
export function nextDonationSlot(
  plan: PersonalPlan,
  type: Donation['type'],
  fromDate: string,
  endDate = `${fromDate.slice(0, 4)}-12-31`,
): DonationSlot {
  if (!validPlanDate(fromDate) || !validPlanDate(endDate) || endDate < fromDate) {
    return { status: 'out-of-range', date: null };
  }
  const issue = donationIssues(plan.donations, plan.donorProfile)[0];
  if (issue) return { status: 'conflict', date: null, issue: issue.message };
  for (let date = fromDate; date <= endDate; date = shiftDay(date, 1)) {
    if (!donationCandidateIssue(plan, { date, type })) return { status: 'available', date };
  }
  return { status: 'out-of-range', date: null };
}
