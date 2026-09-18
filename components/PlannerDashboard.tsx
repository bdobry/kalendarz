import React, { useState } from 'react';
import { formatDateKey } from '../utils/dateUtils';
import { analyzePlan, displayDate, displayRange, type PersonalPlan } from '../utils/personalPlan';
import type { VacationOpportunity } from '../utils/vacationStrategyUtils';
import { PlannerLeaveRange } from './PlannerLeaveRange';

const MONTHS = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
const FULL_MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
const donationUnit = (count: number) => count === 1 ? 'donacja' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'donacje' : 'donacji';

export function PlannerDashboard({ plan, year, workspace, planningDate, ready, result, suggestions, onCalendar, onAdd, onBudget }: {
  plan: PersonalPlan; year: number; workspace: 'leave' | 'donations'; planningDate: string; ready: boolean;
  result: ReturnType<typeof analyzePlan>; suggestions: VacationOpportunity[];
  onCalendar: (date?: string) => void; onAdd: (dates: string[]) => void; onBudget: (value: number) => void;
}) {
  const [showPast, setShowPast] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const budget = plan.budgets[year] ?? 26;
  const remaining = budget - result.used;
  const upcoming = result.breaks.filter(item => item.end >= planningDate);
  const breaks = showPast ? result.breaks : upcoming;
  const displayedBreaks = showAll ? breaks : breaks.slice(0, 4);
  const next = upcoming[0];
  const donations = plan.donations.filter(d => d.date.startsWith(`${year}-`));
  const nextDonation = donations.find(d => d.date >= planningDate);
  const blood = donations.filter(d => d.type === 'blood').length;
  const plasma = donations.length - blood;
  const isDonor = workspace === 'donations';
  const monthCounts = MONTHS.map((_, index) => {
    const prefix = `${year}-${String(index + 1).padStart(2, '0')}-`;
    return isDonor ? donations.filter(d => d.date.startsWith(prefix)).length : plan.leave.filter(date => date.startsWith(prefix) && !result.donated.has(date)).length;
  });
  const ideas = suggestions.map(s => ({ ...s, missing: s.vacationDays.map(formatDateKey).filter(date => !plan.leave.includes(date) && !result.donated.has(date)) })).filter(s => s.missing.length);
  return <div className={`planner-dashboard ${isDonor ? 'planner-dashboard-donor' : ''}`}>
    <div className="planner-metrics" aria-label={isDonor ? `Podsumowanie donacji ${year}` : `Bilans urlopu ${year}`}>
      <section className="planner-metric planner-metric-primary">
        <span>{isDonor ? 'Zapisane donacje' : remaining < 0 ? 'Ponad pulę urlopu' : 'Do zaplanowania'}</span>
        <div className="planner-metric-value" aria-live="polite"><strong>{isDonor ? donations.length : Math.abs(remaining)}</strong><span>{isDonor ? donationUnit(donations.length) : Math.abs(remaining) === 1 ? 'dzień urlopu' : 'dni urlopu'}</span></div>
        {isDonor ? <p>{blood} krwi pełnej · {plasma} osocza</p> : <><label className="planner-pool">Wybrano {result.used} / <input type="number" min="0" max="366" aria-label="Roczna pula urlopu" disabled={!ready} value={budget} onChange={event => { const value = event.target.valueAsNumber; if (Number.isInteger(value) && value >= 0 && value <= 366) onBudget(value); }} /></label><meter min={0} max={Math.max(1, budget)} value={Math.min(result.used, Math.max(1, budget))} aria-label={`${result.used} dni wybranych z puli ${budget}`} />{remaining < 0 && <p className="planner-error">Zwiększ pulę lub zmień terminy.</p>}</>}
      </section>
      <section className="planner-metric"><span>{isDonor ? 'Zwolnienie w dni robocze' : 'W Twoich przerwach'}</span><div className="planner-metric-value"><strong>{isDonor ? result.donationWorkdays : result.total}</strong><span>dni {isDonor ? '' : 'wolnego'}</span></div><p>{isDonor ? 'Dzień donacji + dzień po, jeśli pracujesz.' : 'Łącznie z weekendami, świętami i donacjami.'}</p>{!isDonor && <small>Liczymy tylko przerwy z Twoimi zaznaczeniami.</small>}</section>
      <section className="planner-metric planner-metric-next"><span>{isDonor ? 'Następna zapisana donacja' : next ? next.start <= planningDate ? 'Ta przerwa właśnie trwa' : 'Najbliższe wolne' : 'Następna przerwa'}</span>
        {isDonor ? nextDonation ? <><strong className="planner-next-date">{displayDate(nextDonation.date)}</strong><p>{nextDonation.type === 'blood' ? 'Krew pełna' : 'Osocze'} · {year}</p><button type="button" onClick={() => onCalendar(nextDonation.date)}>Pokaż w kalendarzu <span aria-hidden="true">↗</span></button></> : <><strong className="planner-next-empty">Dobry dzień,<br /> żeby pomóc.</strong><p>Dodaj termin w formularzu poniżej.</p></> : next ? <><strong className="planner-next-date">{displayRange(next.start, next.end)}</strong><p>{next.days} dni ciągiem · {next.leave} dni urlopu{next.donation ? ` · ${next.donation} za donacje` : ''}</p><button type="button" onClick={() => onCalendar(next.start)}>Pokaż w kalendarzu <span aria-hidden="true">↗</span></button></> : <><strong className="planner-next-empty">Jeszcze wszystko<br /> przed Tobą.</strong><button type="button" onClick={() => onCalendar()}>Zaplanuj wolne <span aria-hidden="true">↗</span></button></>}
      </section>
    </div>
    <section className="planner-year-rhythm" aria-labelledby="planner-rhythm-heading">
      <div className="planner-section-heading"><h2 id="planner-rhythm-heading">{isDonor ? 'Twój rytm donacji' : 'Twój rok w skrócie'}</h2><span>{isDonor ? 'donacje' : 'dni urlopu'} · kliknij miesiąc</span></div>
      <div className="planner-month-bars">{monthCounts.map((count, index) => <button type="button" key={index} disabled={!ready} aria-label={`${FULL_MONTHS[index]} ${year}: ${count} ${isDonor ? 'donacji' : 'dni urlopu'}. Otwórz kalendarz`} onClick={() => onCalendar(`${year}-${String(index + 1).padStart(2, '0')}-01`)} className={count ? 'has-days' : ''}><span className="planner-month-bar" aria-hidden="true"><i style={{ height: `${Math.max(5, count / Math.max(1, ...monthCounts) * 100)}%` }} /></span><strong>{count || '—'}</strong><span>{MONTHS[index]}</span></button>)}</div>
    </section>
    {!isDonor && <div className="planner-overview-columns">
      <section className="planner-break-list" aria-labelledby="planner-breaks-heading">
        <div className="planner-section-heading"><h2 id="planner-breaks-heading">Twoje przerwy <span>{result.breaks.length}</span></h2><button type="button" className="planner-text-button" onClick={() => onCalendar()}>Edytuj w kalendarzu ↗</button></div>
        {result.breaks.some(item => item.end < planningDate) && <div className="planner-filter" role="group" aria-label="Pokaż przerwy"><button type="button" aria-pressed={!showPast} onClick={() => { setShowPast(false); setShowAll(false); }}>Nadchodzące</button><button type="button" aria-pressed={showPast} onClick={() => { setShowPast(true); setShowAll(false); }}>Cały rok</button></div>}
        {displayedBreaks.length ? <div className="planner-break-rows">{displayedBreaks.map(item => <button type="button" className="planner-break-row" key={item.start} onClick={() => onCalendar(item.start)}><span className="planner-break-duration"><strong>{item.days}</strong><span>dni wolnego</span></span><span className="planner-break-copy"><strong>{displayRange(item.start, item.end)}</strong><span>{item.leave} dni urlopu{item.donation ? ` + ${item.donation} dni za donacje` : ''}{item.end < planningDate ? ' · termin minął' : ''}</span>{Object.keys(item.byYear).length > 1 && <small>{Object.entries(item.byYear).map(([y, costs]) => `${y}: ${costs.leave} dni urlopu`).join(' · ')}</small>}</span><span aria-hidden="true">↗</span></button>)}</div> : <div className="planner-break-empty"><span aria-hidden="true">☀</span><h3>{result.breaks.length ? 'Czas na kolejną przerwę.' : 'Wolne miejsce na wolne.'}</h3><p>Wybierz termin obok lub zaznacz dni w kalendarzu. Tutaj zobaczysz gotowe ciągi odpoczynku.</p><button type="button" className="planner-button" onClick={() => onCalendar()}>Otwórz kalendarz ↗</button></div>}
        {breaks.length > 4 && <button type="button" className="planner-text-button planner-show-more" onClick={() => setShowAll(!showAll)}>{showAll ? 'Pokaż mniej' : `Pokaż pozostałe (${breaks.length - 4})`}</button>}
        {result.overlap > 0 && <p className="planner-small-note">Donacje pokrywają {result.overlap} zaznaczonych dni urlopu — nie odejmujemy ich z puli.</p>}
        <p className="planner-small-note">Zakładamy pracę pn–pt. Przerwa może obejmować sąsiedni rok; urlop odejmujemy z właściwej puli.</p>
      </section>
      <div className="planner-overview-side"><PlannerLeaveRange plan={plan} donated={result.donated} ready={ready} year={year} onAdd={onAdd} />
      {ideas.length > 0 && <details className="planner-ideas"><summary>Mały mostek, więcej wolnego <span aria-hidden="true">＋</span></summary><div>{ideas.map(idea => <button type="button" key={idea.id} disabled={!ready} onClick={() => onAdd(idea.missing)}><span><strong>{idea.periodName}</strong><span>{displayRange(formatDateKey(idea.startDate), formatDateKey(idea.endDate))}</span></span><span><b>+{idea.missing.length}</b> dni urlopu <span>→ {idea.freeDays} dni wolnego</span></span><span aria-hidden="true">＋</span></button>)}<a href={`/${year}/#planer-urlopu`}>Wszystkie strategie urlopowe ↗</a></div></details>}
      </div>
    </div>}
  </div>;
}
