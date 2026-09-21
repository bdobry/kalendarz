import React, { useState } from 'react';
import { analyzePlan, displayRange } from '../utils/personalPlan';

export function PlannerDashboard({ planningDate, result, onCalendar }: {
  planningDate: string; result: ReturnType<typeof analyzePlan>;
  onCalendar: (date?: string) => void;
}) {
  const [showPast, setShowPast] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const breaks = showPast ? result.breaks : result.breaks.filter(item => item.end >= planningDate);
  const displayedBreaks = showAll ? breaks : breaks.slice(0, 4);
  return <div className="planner-dashboard planner-breaks-only">
    <section className="planner-break-list" aria-labelledby="planner-breaks-heading">
      <div className="planner-section-heading"><h2 id="planner-breaks-heading">Twoje przerwy <span>{result.breaks.length}</span></h2><span>Urlop + weekendy + święta</span></div>
      {result.breaks.some(item => item.end < planningDate) && <div className="planner-filter" role="group" aria-label="Pokaż przerwy"><button type="button" aria-pressed={!showPast} onClick={() => { setShowPast(false); setShowAll(false); }}>Nadchodzące</button><button type="button" aria-pressed={showPast} onClick={() => { setShowPast(true); setShowAll(false); }}>Cały rok</button></div>}
      {displayedBreaks.length ? <div className="planner-break-rows">{displayedBreaks.map(item => <button type="button" className="planner-break-row" key={item.start} onClick={() => onCalendar(item.start)}><span className="planner-break-duration"><strong>{item.days}</strong><span>dni wolnego</span></span><span className="planner-break-copy"><strong>{displayRange(item.start, item.end)}</strong><span>{item.leave} dni urlopu{item.donation ? ` + ${item.donation} dni za donacje` : ''}{item.end < planningDate ? ' · termin minął' : ''}</span>{Object.keys(item.byYear).length > 1 && <small className="plan-break-years">{Object.entries(item.byYear).map(([y, costs]) => `${y}: ${costs.leave} dni urlopu`).join(' · ')}</small>}</span><span aria-hidden="true">↗</span></button>)}</div> : <p className="planner-break-empty">{result.breaks.length ? 'Nie masz jeszcze kolejnej przerwy.' : 'Zaznacz dni w kalendarzu — tutaj zobaczysz, ile wolnego tworzą razem.'}</p>}
      {breaks.length > 4 && <button type="button" className="planner-text-button planner-show-more" onClick={() => setShowAll(!showAll)}>{showAll ? 'Pokaż mniej' : `Pokaż pozostałe (${breaks.length - 4})`}</button>}
      {result.overlap > 0 && <p className="planner-small-note">Donacje pokrywają {result.overlap} zaznaczonych dni urlopu — nie odejmujemy ich z puli.</p>}
      <p className="planner-small-note">Liczymy pracę pn–pt i przerwy z Twoimi zaznaczeniami. Na przełomie lat urlop odejmujemy z puli właściwego roku.</p>
    </section>

  </div>;
}
