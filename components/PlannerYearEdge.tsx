import React, { useMemo } from 'react';
import { formatDateKey, getPolishHolidays } from '../utils/dateUtils';

/** A full-height calendar tab beside January or December. */
export function PlannerYearEdge({ side, year, expanded, ready, onExpand, children }: {
  side: 'previous' | 'next';
  year: number;
  expanded: boolean;
  ready: boolean;
  onExpand: () => void;
  children: React.ReactNode;
}) {
  const previous = side === 'previous';
  const monthIndex = previous ? 11 : 0;
  const month = previous ? 'Grudzień' : 'Styczeń';
  const preview = useMemo(() => {
    const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const holidays = getPolishHolidays(year);
    return Array.from({ length: offset + 31 }, (_, i) => {
      if (i < offset) return null;
      const date = new Date(year, monthIndex, i - offset + 1);
      return { day: date.getDate(), weekend: i % 7 > 4, holiday: holidays.has(formatDateKey(date)) };
    });
  }, [year, monthIndex]);
  return <div className={`plan-year-boundary plan-boundary-${side} ${expanded ? 'plan-year-pair' : ''}`}>
    {!expanded && <button id={`plan-show-month-${year}-${monthIndex}`} type="button" className="plan-month-peek" disabled={!ready} aria-label={`Pokaż ${month.toLowerCase()} ${year}`} aria-expanded={false} onClick={onExpand}>
      <span className="plan-peek-face" aria-hidden="true">
        <svg className="plan-peek-calendar" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="19" rx="3" />
          <path d="M3 10h18M8 2v4m8-4v4" />
          <text x="12" y="19" textAnchor="middle" fill="currentColor" stroke="none">{previous ? '12' : '01'}</text>
        </svg>
        <span className="plan-peek-label"><span>{month}</span><b>{year}</b></span>
        <span className="plan-peek-arrow">{previous ? '←' : '→'}</span>
      </span>
      <span className="plan-peek-preview" aria-hidden="true"><span className="plan-preview-card">
        <span className="plan-preview-title">{month} <span>{year}</span></span>
        <span className="plan-preview-weekdays">{['pn', 'wt', 'śr', 'cz', 'pt', 'so', 'nd'].map(day => <span key={day}>{day}</span>)}</span>
        <span className="plan-preview-days">{preview.map((day, i) => <span key={i} className={day ? `${day.weekend ? 'is-weekend' : ''} ${day.holiday ? 'is-holiday' : ''}` : undefined}>{day?.day}</span>)}</span>
      </span></span>
    </button>}
    {children}
  </div>;
}
