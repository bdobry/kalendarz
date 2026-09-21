import React, { useMemo, useState } from 'react';
import { leaveInRange, PLAN_MAX_YEAR, PLAN_MIN_YEAR, type PersonalPlan } from '../utils/personalPlan';

export function PlannerLeaveRange({ plan, donated, ready, year, onAdd }: {
  plan: PersonalPlan; donated: Set<string>; ready: boolean; year: number; onAdd: (dates: string[]) => void;
}) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const preview = useMemo(() => {
    if (!start || !end) return { dates: [] as string[], error: '' };
    try { return { dates: leaveInRange(start, end).filter(date => !plan.leave.includes(date) && !donated.has(date)), error: '' }; }
    catch (error) { return { dates: [] as string[], error: (error as Error).message }; }
  }, [start, end, plan.leave, donated]);
  const byYear = preview.dates.reduce<Record<string, number>>((years, date) => { years[date.slice(0, 4)] = (years[date.slice(0, 4)] ?? 0) + 1; return years; }, {});
  return <form className="planner-range" onSubmit={event => {
    event.preventDefault();
    if (preview.error || !preview.dates.length) return;
    onAdd(preview.dates); setStart(''); setEnd('');
    const popover = event.currentTarget.closest('details');
    if (popover) { popover.open = false; popover.querySelector('summary')?.focus(); }
  }}>
    <div className="planner-section-heading"><h2>Dodaj urlop</h2><span aria-hidden="true">＋</span></div>
    <p>Podaj daty całej przerwy. Dodamy tylko potrzebne dni urlopu.</p>
    <div className="planner-range-fields">
      <label>Od<input aria-label="Początek urlopu" type="date" required min={`${PLAN_MIN_YEAR}-01-01`} max={`${PLAN_MAX_YEAR}-12-31`} value={start} disabled={!ready} onChange={event => { setStart(event.target.value); if (!end || end < event.target.value) setEnd(event.target.value); }} /></label>
      <span aria-hidden="true">→</span>
      <label>Do<input aria-label="Koniec urlopu" type="date" required min={start || `${PLAN_MIN_YEAR}-01-01`} max={`${PLAN_MAX_YEAR}-12-31`} value={end} disabled={!ready} onChange={event => setEnd(event.target.value)} /></label>
    </div>
    <div className="planner-range-preview" aria-live="polite">{preview.error ? <span className="planner-error">{preview.error}</span> : start && end ? <>{preview.dates.length ? <><strong>{preview.dates.length} dni</strong> do dodania{Object.keys(byYear).some(y => Number(y) !== year) && <span>{Object.entries(byYear).map(([y, count]) => `${y}: ${count} dni`).join(' · ')}</span>}</> : 'W tym terminie nie potrzebujesz dodatkowego urlopu.'}</> : 'Weekendy, święta i zapisane wolne pomijamy.'}</div>
    <button type="submit" className="planner-button planner-button-dark" disabled={!ready || !preview.dates.length || !!preview.error}>Dodaj do planu <span aria-hidden="true">↗</span></button>
  </form>;
}
