import React, { useId, useState } from 'react';
import { PLAN_MAX_YEAR, PLAN_MIN_YEAR } from '../utils/personalPlan';
import { EFFICIENCY_CLASSES } from '../utils/efficiencyClasses';

export function CalendarYear({ year, efficiencyClass, interactive, ready, primary, onChange }: {
  year: number;
  efficiencyClass: string;
  interactive: boolean;
  ready: boolean;
  primary: boolean;
  onChange: (year: number) => void;
}) {
  const Heading = primary ? 'h1' : 'h2';
  const rating = EFFICIENCY_CLASSES.find(item => item.id === efficiencyClass)!;
  const tooltipId = useId();
  const [showTooltip, setShowTooltip] = useState(false);
  return <div className="calendar-year-context">
    <div className={`calendar-year ${interactive ? 'is-editable' : ''}`}>
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
    </div>
    <div className="calendar-efficiency" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)} onKeyDown={event => { if (event.key === 'Escape') setShowTooltip(false); }}>
      <button type="button" className={`calendar-efficiency-grade ${rating.color} ${rating.ink}`} aria-label={`Efektywność świąt ${year}: klasa ${efficiencyClass}`} aria-describedby={showTooltip ? tooltipId : undefined} onFocus={() => setShowTooltip(true)} onBlur={() => setShowTooltip(false)} onClick={() => setShowTooltip(true)}>{efficiencyClass}</button>
      <div id={tooltipId} role="tooltip" hidden={!showTooltip} className="calendar-efficiency-tooltip bg-neutral-800 text-neutral-200 text-xs p-3 rounded-lg shadow-xl border border-neutral-700">
        <strong className="block text-white border-b border-neutral-600 pb-1 mb-2">{rating.label} · {efficiencyClass}</strong>
        <p>Im więcej świąt w dni robocze, długich weekendów i mostków, tym wyższa klasa.</p>
        <p className="mt-2 text-neutral-400">Skala od A (najlepszej) do G.</p>
      </div>
    </div>
  </div>;
}
