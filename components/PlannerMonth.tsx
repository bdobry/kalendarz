import React, { useMemo } from 'react';
import { DayType, type MonthData } from '../types';
import { formatDateKey } from '../utils/dateUtils';
import { holidayOn, isWorkday, shiftDay, type PersonalPlan } from '../utils/personalPlan';
import { getSchoolBreaks } from '../utils/schoolBreaks';
import { DayCell } from './DayCell';

export function PlannerMonth({ month, activeYear, plan, leave, donated, breakDates, blockedDonations, tool, ready, onSelect, onSwitchYear, onClose, interactive = true, showSuggestions = true, hoveredSequenceId, onHoverSequence }: {
  month: MonthData;
  activeYear: number;
  plan: PersonalPlan;
  leave: Set<string>;
  donated: Set<string>;
  breakDates: Set<string>;
  blockedDonations: Map<string, string>;
  tool: 'leave' | 'blood' | 'plasma';
  ready: boolean;
  onSelect: (date: string) => void;
  onSwitchYear: (year: number, date?: string) => void;
  onClose?: () => void;
  interactive?: boolean;
  showSuggestions?: boolean;
  hoveredSequenceId?: string | null;
  onHoverSequence?: (id: string | null) => void;
}) {
  const adjacent = month.year !== activeYear;
  const school = useMemo(() => plan.school.enabled ? getSchoolBreaks(month.year, plan.school.region) : [], [month.year, plan.school.enabled, plan.school.region]);
  const selectedHere = month.weeks.flat().filter(day => day.isCurrentMonth && leave.has(formatDateKey(day.date)) && !donated.has(formatDateKey(day.date))).length;
  return <section className={`plan-month year-month ${adjacent ? 'plan-month-adjacent' : ''}`} id={`plan-month-${month.year}-${month.monthIndex}`} aria-label={`${month.name} ${month.year}`} tabIndex={-1}>
    {adjacent && <p className="plan-month-context">{month.year < activeYear ? 'Poprzedni rok' : 'Kolejny rok'}</p>}
    {adjacent && onClose && <button type="button" className="plan-month-close" aria-label={`Schowaj ${month.name.toLowerCase()} ${month.year}`} onClick={onClose}><svg aria-hidden="true" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="m4 4 8 8m0-8-8 8" /></svg></button>}
    <h3>{month.name}{adjacent && <span> {month.year}</span>}</h3>
    <div className="plan-weekdays">{['pn', 'wt', 'śr', 'cz', 'pt', 'so', 'nd'].map(d => <span key={d}>{d}</span>)}</div>
    <div className="plan-days">{month.weeks.flat().map((day, i) => {
      if (!day.isCurrentMonth) return <span key={i} aria-hidden="true" />;
      // Donation planning shows actual time off, without proposing unrelated leave bridges.
      // Copy the visual data only: the shared calendar and saved plan remain unchanged.
      if (!showSuggestions && day.isBridgeSequence) day = {
        ...day,
        dayType: day.dayType === DayType.BRIDGE ? DayType.WORKDAY : day.dayType,
        isBridgeSequence: false, isLongWeekendSequence: false,
        isSequenceStart: false, isSequenceEnd: false,
        connectsToNextWeek: false, connectsToPrevWeek: false,
        sequenceInfo: undefined, linkedHolidayName: undefined,
      };
      if (!interactive) return <DayCell key={i} day={day} currentMonthIndex={month.monthIndex} hideGhostDays shapedWave hoveredSequenceId={hoveredSequenceId} onHoverSequence={onHoverSequence} />;
      const key = formatDateKey(day.date), working = isWorkday(key), holiday = holidayOn(key);
      const donation = donated.has(key), selected = leave.has(key), inBreak = breakDates.has(key);
      const schoolDay = school.find(s => key >= s.start && key <= s.end);
      const donationStart = plan.donations.find(d => d.date === key);
      const blocked = blockedDonations.get(key);
      const schoolClass = schoolDay ? `is-school ${schoolDay.label === 'Wakacje' ? 'is-summer' : 'is-winter'}` : '';
      // Only the actual ends are rounded. A week/month/year boundary keeps its connector open.
      const breakStart = inBreak && !breakDates.has(shiftDay(key, -1));
      const breakEnd = inBreak && !breakDates.has(shiftDay(key, 1));
      const label = `${day.date.getDate()} ${day.date.toLocaleDateString('pl-PL', { month: 'long' })} ${month.year}${holiday ? `, ${holiday}` : ''}${selected ? ', zaplanowany urlop' : ''}${donation ? ', zwolnienie za donację' : ''}${schoolDay ? `, ${schoolDay.label}` : ''}`;
      return <DayCell key={key} day={day} currentMonthIndex={month.monthIndex} hideGhostDays shapedWave hoveredSequenceId={hoveredSequenceId} onHoverSequence={onHoverSequence} hideWave={selected || donation} interaction={{
        type: 'button', 'data-date': key,
        className: `plan-day ${holiday ? 'is-holiday' : ''} ${day.isBridgeSequence ? 'is-suggestion' : ''} ${inBreak ? 'is-break' : ''} ${breakStart ? 'break-start' : ''} ${breakEnd ? 'break-end' : ''} ${selected && !donation ? 'is-leave' : ''} ${donation ? 'is-donation' : ''} ${schoolClass} ${blocked ? 'is-blocked' : ''}`,
        'aria-label': label, title: blocked || label, 'aria-disabled': blocked ? true : undefined,
        'aria-pressed': tool === 'leave' ? selected : !!donationStart,
        disabled: !ready || (tool === 'leave' && (!working || (donation && !selected))), onClick: () => onSelect(key)
      }}><span className="plan-day-number">{day.date.getDate()}</span></DayCell>;
    })}</div>
    {adjacent && <div className="plan-month-cost"><p><strong>{selectedHere} dni urlopu</strong><span className="plan-month-pool"> z puli {month.year}</span></p><button type="button" aria-label={`Cały rok ${month.year}`} onClick={() => onSwitchYear(month.year, `${month.year}-${String(month.monthIndex + 1).padStart(2, '0')}-01`)}>Cały rok →</button></div>}
  </section>;
}
