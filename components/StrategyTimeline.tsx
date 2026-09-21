import React, { useMemo } from 'react';
import { formatDateKey, getPolishHolidays } from '../utils/dateUtils';
import type { VacationOpportunity } from '../utils/vacationStrategyUtils';
import { LeaveWave } from './LeaveWave';

export function StrategyTimeline({ strategy }: { strategy: VacationOpportunity }) {
  const days = useMemo(() => {
    const leave = new Set(strategy.vacationDays.map(formatDateKey));
    const holidays = new Map([...getPolishHolidays(strategy.startDate.getFullYear()), ...getPolishHolidays(strategy.endDate.getFullYear())]);
    const result = [];
    for (const date = new Date(strategy.startDate); date <= strategy.endDate; date.setDate(date.getDate() + 1)) {
      const key = formatDateKey(date);
      result.push({ key, date: new Date(date), leave: leave.has(key), holiday: holidays.get(key) });
    }
    return result;
  }, [strategy]);
  return <div className="strategy-timeline-scroll" role="region" aria-label={`Podgląd dni: ${strategy.periodName || 'urlop'}`} tabIndex={0}>
    <ol className="strategy-timeline" style={{ '--timeline-days': days.length } as React.CSSProperties}>
      {days.map(day => <li key={day.key} data-timeline-date={day.key} className={`strategy-timeline-day ${day.leave ? 'is-leave shaped-bridge' : day.holiday ? 'is-holiday' : 'is-weekend'}`} title={`${day.date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${day.leave ? 'urlop' : day.holiday || 'weekend'}`}>
        <span aria-hidden="true">{['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SO'][day.date.getDay()]}</span>
        <time dateTime={day.key} aria-label={`${day.date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}, ${day.leave ? 'urlop' : day.holiday || 'weekend'}`}>{String(day.date.getDate()).padStart(2, '0')}</time>
        {day.leave && <LeaveWave />}
      </li>)}
    </ol>
  </div>;
}
