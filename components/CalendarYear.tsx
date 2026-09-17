import React from 'react';
import { PLAN_MAX_YEAR, PLAN_MIN_YEAR } from '../utils/personalPlan';

export function CalendarYear({ year, interactive, ready, primary, onChange }: {
  year: number;
  interactive: boolean;
  ready: boolean;
  primary: boolean;
  onChange: (year: number) => void;
}) {
  const Heading = primary ? 'h1' : 'h2';
  return <div className={`calendar-year ${interactive ? 'is-editable' : ''}`}>
    {interactive && <button type="button" className="calendar-year-arrow" disabled={!ready || year === PLAN_MIN_YEAR} onClick={() => onChange(year - 1)} aria-label="Poprzedni rok planu">←</button>}
    <div className="calendar-year-value">
      <Heading aria-label={`Kalendarz ${year}`}>{year}</Heading>
      {interactive && <>
        <svg className="calendar-year-chevron" aria-hidden="true" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m3 4.5 3 3 3-3" /></svg>
        <select aria-label="Rok planu" value={year} disabled={!ready} onChange={e => onChange(Number(e.target.value))}>
          {Array.from({ length: PLAN_MAX_YEAR - PLAN_MIN_YEAR + 1 }, (_, i) => <option key={i}>{PLAN_MIN_YEAR + i}</option>)}
        </select>
      </>}
    </div>
    {interactive && <button type="button" className="calendar-year-arrow" disabled={!ready || year === PLAN_MAX_YEAR} onClick={() => onChange(year + 1)} aria-label="Następny rok planu">→</button>}
  </div>;
}
