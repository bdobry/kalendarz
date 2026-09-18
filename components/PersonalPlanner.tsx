import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatDateKey, generateCalendarData, getYearStats } from '../utils/dateUtils';
import { getPlanningDate, getVacationSuggestions } from '../utils/vacationSuggestions';
import { PlanningFaq } from './PlanningFaq';
import { PlannerSchoolControl, PlannerSchoolPanel } from './PlannerSchoolPanel';
import { PlannerMonth } from './PlannerMonth';
import { PlannerMonthGrid } from './PlannerMonthGrid';
import { PlannerYearEdge } from './PlannerYearEdge';
import { PlannerDonations } from './PlannerDonations';
import { Legend } from './Legend';
import { CalendarYear } from './CalendarYear';
import { donationCandidateIssue, donationIssues } from '../utils/donationRules';
import { analyzePlan, displayDate, displayRange, emptyPlan, donationDays, isWorkday, parsePlan, parsePlannerHash, plannerHref, PLAN_KEY, PLAN_MAX_YEAR, PLAN_MIN_YEAR, shiftDay, type PersonalPlan } from '../utils/personalPlan';

type Tool = 'leave' | 'blood' | 'plasma';
const toolLabels: Record<Tool, string> = { leave: 'Urlop', blood: 'Krew', plasma: 'Osocze' };
export function PersonalPlanner({ planningDate, calendarYear, redeemSaturdays = false }: { planningDate: string; calendarYear?: number; redeemSaturdays?: boolean }) {
  const embedded = calendarYear !== undefined;
  const initialYear = calendarYear ?? Math.min(PLAN_MAX_YEAR, Math.max(PLAN_MIN_YEAR, Number(planningDate.slice(0, 4))));
  const [interactive, setInteractive] = useState(!embedded);
  const [hoveredSequenceId, setHoveredSequenceId] = useState<string | null>(null);
  const [year, setYear] = useState(initialYear);
  const [plan, setPlan] = useState<PersonalPlan>(emptyPlan);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState('Odczytuję Twój plan…');
  const [message, setMessage] = useState('');
  const [jumpDate, setJumpDate] = useState('');
  const [tool, setTool] = useState<Tool>('leave');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const calendarElement = useRef<HTMLDivElement>(null);
  const monthPositions = useRef<Map<string, { left: number; top: number; width: number }> | null>(null);
  const canPersist = useRef(true);
  const initialized = useRef(false);
  const calendar = useMemo(() => generateCalendarData(year), [year]);
  const efficiencyClass = useMemo(() => getYearStats(calendar, redeemSaturdays).efficiencyClass, [calendar, redeemSaturdays]);
  const resultsByYear = useMemo(() => new Map([year - 1, year, year + 1]
    .filter(y => y === year || (y >= PLAN_MIN_YEAR && y <= PLAN_MAX_YEAR))
    .map(y => [y, analyzePlan(plan, y)])), [plan, year]);
  const result = resultsByYear.get(year)!;
  const leave = useMemo(() => new Set(plan.leave), [plan.leave]);
  const breakDates = useMemo(() => {
    const dates = new Set<string>();
    for (const analysis of resultsByYear.values()) {
      analysis.breaks.forEach(b => { for (let d = b.start; d <= b.end; d = shiftDay(d, 1)) dates.add(d); });
    }
    return dates;
  }, [resultsByYear]);
  const previousMonthKey = `${year - 1}-12`, nextMonthKey = `${year + 1}-01`;
  const hasMonthPlan = (key: string) => [...plan.leave, ...result.donated].some(date => date.startsWith(`${key}-`));
  const showPrevious = year > PLAN_MIN_YEAR && (expandedMonths[previousMonthKey] ?? hasMonthPlan(previousMonthKey));
  const showNext = year < PLAN_MAX_YEAR && (expandedMonths[nextMonthKey] ?? hasMonthPlan(nextMonthKey));
  const visibleCalendar = useMemo(() => [
    ...(showPrevious ? [generateCalendarData(year - 1)[11]] : []),
    ...calendar,
    ...(showNext ? [generateCalendarData(year + 1)[0]] : [])
  ], [calendar, year, showPrevious, showNext]);
  const hasVisibleDonations = interactive && [...result.donated].some(date =>
    visibleCalendar.some(month => date.startsWith(`${month.year}-${String(month.monthIndex + 1).padStart(2, '0')}-`))
  );
  const otherYears = [...resultsByYear].filter(([y, analysis]) => y !== year && (analysis.used || analysis.donationWorkdays));
  const budget = plan.budgets[year] ?? 26;
  const suggestions = useMemo(() => getVacationSuggestions(year, year === initialYear ? planningDate : `${year}-01-01`, 3), [year, initialYear, planningDate]);
  const blockedDonations = useMemo(() => {
    const blocked = new Map<string, string>();
    if (tool === 'leave') return blocked;
    const existing = new Set(plan.donations.map(d => d.date));
    for (const day of visibleCalendar.flatMap(month => month.weeks.flat()).filter(day => day.isCurrentMonth)) {
      const date = formatDateKey(day.date);
      if (existing.has(date)) continue;
      const issue = donationCandidateIssue(plan, { date, type: tool });
      if (issue) blocked.set(date, issue);
    }
    return blocked;
  }, [visibleCalendar, tool, plan.donations, plan.donorProfile]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    let restored = emptyPlan();
    try {
      const stored = localStorage.getItem(PLAN_KEY);
      if (stored) restored = parsePlan(stored);
      setSaved(stored ? 'Plan odczytany z tej przeglądarki' : 'Zapiszę po pierwszej zmianie');
    } catch {
      canPersist.current = false;
      setSaved('Zapis niedostępny — zmiany tylko w tej sesji');
      setMessage('Nie udało się odczytać pamięci przeglądarki. Możesz planować w tej sesji, ale zmiany nie zapiszą się po zamknięciu strony. Istniejący zapis pozostaje bez zmian.');
    }
    const incoming = embedded ? { year: calendarYear, dates: [] as string[] } : parsePlannerHash(window.location.hash, Number(getPlanningDate().slice(0, 4)));
    if (embedded && window.location.hash === '#planer' && calendarYear >= PLAN_MIN_YEAR) setInteractive(true);
    setYear(incoming.year);
    const donorDates = donationDays(restored);
    const added = incoming.dates.filter(date => !restored.leave.includes(date) && !donorDates.has(date));
    if (added.length) {
      const next = { ...restored, leave: [...restored.leave, ...added].sort() };
      setPlan(next); persist(next);
      setMessage(`Dodano mostek ze strategii: ${added.length} dni urlopu.`);
    } else {
      setPlan(restored);
      if (incoming.dates.length) setMessage('Ten mostek jest już w Twoim planie.');
      else if (donationIssues(restored.donations, restored.donorProfile).length) setMessage('Zapisany plan zawiera kolidujące donacje. Popraw oznaczone wpisy w sekcji donacji.');
    }
    if (incoming.dates.length) { window.history.replaceState(null, '', plannerHref(incoming.year)); setJumpDate(incoming.dates.find(date => date.startsWith(`${incoming.year}-`)) ?? incoming.dates[0]); }
    setReady(true);
  }, [planningDate]);

  useEffect(() => {
    if (!ready) return;
    const target = embedded && window.location.hash === '#planer' ? 'kalendarz'
      : !embedded && new URLSearchParams(window.location.hash.slice(1)).get('sekcja') === 'donacje' ? 'donacje-info' : null;
    if (!target) return;
    const frame = requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [ready, embedded]);

  useEffect(() => {
    if (!ready || !jumpDate) return;
    const frame = requestAnimationFrame(() => {
      const month = document.getElementById(`plan-month-${jumpDate.slice(0, 4)}-${Number(jumpDate.slice(5, 7)) - 1}`);
      month?.focus({ preventScroll: true });
      month?.scrollIntoView({ block: month.classList.contains('plan-month-adjacent') ? 'nearest' : 'center', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
      setJumpDate('');
    });
    return () => cancelAnimationFrame(frame);
  }, [ready, jumpDate, year]);

  // Animate existing months from their previous positions when the grid gains or loses a month.
  useLayoutEffect(() => {
    const before = monthPositions.current;
    monthPositions.current = null;
    if (!before || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations: Animation[] = [];
    calendarElement.current?.querySelectorAll<HTMLElement>('.plan-month').forEach(month => {
      const previous = before.get(month.id);
      if (!previous) return;
      const rect = month.getBoundingClientRect();
      const x = previous.left - (rect.left + window.scrollX);
      const y = previous.top - (rect.top + window.scrollY);
      const scale = previous.width / rect.width;
      if (Math.abs(x) < 1 && Math.abs(y) < 1 && Math.abs(previous.width - rect.width) < 1) return;
      animations.push(month.animate([{ transformOrigin: 'top left', transform: `translate(${x}px, ${y}px) scaleX(${scale})` }, { transformOrigin: 'top left', transform: 'translate(0, 0) scaleX(1)' }], { duration: 360, easing: 'cubic-bezier(.22, 1, .36, 1)' }));
    });
    return () => animations.forEach(animation => animation.cancel());
  }, [expandedMonths, year]);

  useEffect(() => {
    if (!ready || embedded) return;
    const receive = () => {
      if (!window.location.hash.includes('rok=')) return;
      const incoming = parsePlannerHash(window.location.hash, year);
      setYear(incoming.year);
      if (incoming.dates.length) { setTool('leave'); addLeave(incoming.dates); setJumpDate(incoming.dates.find(date => date.startsWith(`${incoming.year}-`)) ?? incoming.dates[0]); }
      window.history.replaceState(null, '', plannerHref(incoming.year));
    };
    window.addEventListener('hashchange', receive);
    return () => window.removeEventListener('hashchange', receive);
  }, [ready, plan, year]);

  function persist(next: PersonalPlan) {
    if (!canPersist.current) return;
    try { localStorage.setItem(PLAN_KEY, JSON.stringify(next)); setSaved('Zapisano w tej przeglądarce'); }
    catch { setSaved('Zapis niedostępny — zmiany tylko w tej sesji'); }
  }
  function update(next: PersonalPlan, note = '') {
    setPlan(next); persist(next); setMessage(note);
  }
  function switchYear(next: number, date?: string) {
    if (next < PLAN_MIN_YEAR || next > PLAN_MAX_YEAR) return;
    if (embedded) { window.location.assign(`/${next}/#planer`); return; }
    setYear(next); setMessage('');
    if (date) setJumpDate(date);
    window.history.replaceState(null, '', plannerHref(next));
  }
  function addLeave(dates: string[], announce = true) {
    const newDates = dates.filter(date => !leave.has(date) && !result.donated.has(date));
    update({ ...plan, leave: [...new Set([...plan.leave, ...newDates])].sort() }, !announce ? '' : newDates.length ? `Dodano dni urlopu: ${newDates.length}.${newDates.some(date => !date.startsWith(`${year}-`)) ? ' Dni spoza tego roku zapisano w puli właściwego roku.' : ' Mostki już policzone.'}` : 'Te dni są już w planie lub pokrywa je donacja.');
  }
  function selectDay(key: string) {
    if (tool === 'leave') {
      if (leave.has(key)) update({ ...plan, leave: plan.leave.filter(d => d !== key) });
      else if (isWorkday(key) && !result.donated.has(key)) addLeave([key], false);
    } else {
      const existing = plan.donations.find(d => d.date === key);
      if (!existing) {
        const issue = donationCandidateIssue(plan, { date: key, type: tool });
        if (issue) { setMessage(issue); return; }
      }
      update({ ...plan, donations: existing ? plan.donations.filter(d => d.date !== key) : [...plan.donations, { date: key, type: tool }].sort((a, b) => a.date.localeCompare(b.date)) }, existing ? 'Usunięto planowaną donację.' : `Planowana donacja: ${displayDate(key)}. Zaznaczono też następny dzień kalendarzowy.`);
    }
  }
  function resetYearPlan() {
    const prefix = `${year}-`;
    update({ ...plan, leave: plan.leave.filter(date => !date.startsWith(prefix)), donations: plan.donations.filter(donation => !donation.date.startsWith(prefix)) }, `Zresetowano urlop i donacje z ${year}. Pula urlopu i ustawienia pozostają zapisane.`);
  }

  function toggleMode() {
    setInteractive(current => !current);
    setHoveredSequenceId(null);
    if (embedded) window.history.replaceState(null, '', interactive ? `/${year}/#kalendarz` : `/${year}/#planer`);
  }

  const rememberMonthPositions = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    monthPositions.current = new Map(Array.from(calendarElement.current?.querySelectorAll<HTMLElement>('.plan-month') ?? [], month => {
      const rect = month.getBoundingClientRect();
      return [month.id, { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width }];
    }));
  };
  const expandMonth = (key: string) => {
    rememberMonthPositions();
    setExpandedMonths(current => ({ ...current, [key]: true }));
    setJumpDate(`${key}-01`);
  };
  const closeMonth = (month: (typeof calendar)[number]) => {
    rememberMonthPositions();
    setExpandedMonths(current => ({ ...current, [`${month.year}-${String(month.monthIndex + 1).padStart(2, '0')}`]: false }));
    requestAnimationFrame(() => {
      const trigger = document.getElementById(`plan-show-month-${month.year}-${month.monthIndex}`);
      trigger?.focus({ preventScroll: true });
      trigger?.scrollIntoView({ block: 'nearest', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
  };
  const renderMonth = (month: (typeof calendar)[number]) => <PlannerMonth key={`${month.year}-${month.monthIndex}`} month={month} activeYear={year} plan={plan} leave={leave} donated={result.donated} breakDates={breakDates} blockedDonations={blockedDonations} tool={tool} ready={ready} interactive={interactive} hoveredSequenceId={hoveredSequenceId} onHoverSequence={setHoveredSequenceId} onSelect={selectDay} onSwitchYear={switchYear} onClose={month.year !== year ? () => closeMonth(month) : undefined} />;

  return <div id={embedded ? "kalendarz" : undefined} className={`personal-planner unified-planner ${embedded ? 'planner-embedded' : ''} ${interactive ? 'planner-active' : 'planner-static'}`}>
    {!embedded && <section className="plan-hero" aria-labelledby="plan-heading">
      <div><p className="leave-eyebrow">NIEROBIE.PL · BEZ KONTA</p><h1 id="plan-heading">Planer<br /> <span>urlopu.</span></h1><p>Zaplanuj przerwy od pracy na cały rok. Zaznacz urlop w kalendarzu — połączymy go z weekendami i świętami, policzymy dni wolnego i zapiszemy Twój plan w tej przeglądarce.</p><div className="plan-pills"><span>Bez konta</span><span>Bez opłat</span><span>Zapis na tym urządzeniu</span></div></div>
      <div className="plan-hero-note"><span>WEEKEND TO DOPIERO POCZĄTEK</span><strong>Wolne nie musi kończyć się <em>w niedzielę.</em></strong><ol><li><b>01</b> Zaznaczasz dni urlopu.</li><li><b>02</b> Widzisz, ile wolnego tworzą.</li><li><b>03</b> Wracasz do zapisanego planu.</li></ol></div>
    </section>}
    <noscript><p className="plan-notice">Włącz JavaScript, aby zaznaczać dni i zapisywać plan. Kalendarz i informacje poniżej są dostępne bez niego.</p></noscript>
    <div className="plan-workspace">
      <div className="plan-calendar-panel year-calendar">
        <div className="calendar-heading">
          <CalendarYear year={year} efficiencyClass={efficiencyClass} interactive={interactive} ready={ready} primary={embedded} onChange={switchYear} />
          <Legend interactive={interactive} hasDonations={hasVisibleDonations} />
          <div className="calendar-heading-actions">
            {year >= PLAN_MIN_YEAR && <button type="button" className="calendar-mode-toggle" role="switch" aria-checked={interactive} aria-label="Planer urlopu" disabled={!ready} onClick={toggleMode}><span className="calendar-mode-track" aria-hidden="true"><span /></span>Planer urlopu</button>}
          </div>
        </div>
        {interactive && <div className="plan-editing-controls">
    <div className="plan-topbar">
      <p className="plan-save-status" role="status">{saved}</p>
      <div className="plan-actions"><button type="button" disabled={!ready || ![...plan.leave, ...plan.donations.map(d => d.date)].some(date => date.startsWith(`${year}-`))} title={`Wyczyść urlop i donacje z ${year}; zachowaj ustawienia i pozostałe lata`} onClick={resetYearPlan}>↻ Resetuj</button></div>
    </div>

    <div className="plan-feedback" role="status">{message && <><span>{message}</span><button type="button" aria-label="Zamknij komunikat" onClick={() => setMessage('')}>×</button></>}</div>
        <div className="plan-tools"><div role="group" aria-label="Co zaznaczasz w kalendarzu">{(['leave', 'blood', 'plasma'] as Tool[]).map(t => <button key={t} disabled={!ready} aria-pressed={tool === t} onClick={() => setTool(t)}>{t === 'leave' ? '＋' : '♡'} {toolLabels[t]}</button>)}</div></div>
        <div className="plan-budget-control" aria-label={`Pula urlopu na ${year}`}>
          <label className="plan-budget"><span>Urlop {year}</span><span className="plan-budget-values"><strong className={budget < result.used ? 'plan-over-budget' : undefined} title={budget < result.used ? `Przekraczasz pulę o ${result.used - budget} dni.` : undefined} aria-label={`Wybrano ${result.used} dni urlopu z ${budget}${budget < result.used ? `. Przekraczasz pulę o ${result.used - budget} dni.` : ''}`} aria-live="polite">{result.used}</strong><span aria-hidden="true">/</span><input aria-label="Roczna pula urlopu" title="Twoja roczna pula urlopu" type="number" min="0" max="366" value={budget} disabled={!ready} onChange={e => { const value = e.target.valueAsNumber; if (Number.isInteger(value) && value >= 0 && value <= 366) update({ ...plan, budgets: { ...plan.budgets, [year]: value } }); }} /><span>dni</span></span></label>
        </div>
        <PlannerSchoolControl school={plan.school} ready={ready} onChange={school => update({ ...plan, school })} />
        <p className="plan-help">{tool === 'leave' ? 'Kliknij dzień roboczy, żeby dodać urlop. Kliknij ponownie, żeby go usunąć.' : `Zaznaczasz: ${tool === 'blood' ? 'oddanie krwi' : 'oddanie osocza'}. Kliknij dzień planowanej donacji. Ponowne kliknięcie usuwa wpis.`}</p>
        {tool !== 'leave' && <p className="plan-donation-help">Przekreślone daty nie spełniają odstępów lub limitów donacji. Kliknij je, żeby poznać powód. {embedded ? <a className="plan-text-link" href={plannerHref(year) + '&sekcja=donacje'}>Twój profil, historia i limity ↗</a> : <button type="button" className="plan-text-link" onClick={() => document.getElementById('donacje-info')?.scrollIntoView({ block: 'start' })}>Twój profil, historia i limity ↓</button>}</p>}
        </div>}
        <PlannerMonthGrid calendarRef={calendarElement} items={[
          { id: 'january', span: interactive && showPrevious ? 2 : 1, content: interactive && year > PLAN_MIN_YEAR ? <PlannerYearEdge side="previous" year={year - 1} expanded={showPrevious} ready={ready} onExpand={() => expandMonth(previousMonthKey)}>
            {showPrevious && renderMonth(visibleCalendar[0])}{renderMonth(calendar[0])}
          </PlannerYearEdge> : renderMonth(calendar[0]) },
          ...calendar.slice(1, -1).map(month => ({ id: month.name, span: 1, content: renderMonth(month) })),
          { id: 'december', span: interactive && showNext ? 2 : 1, content: interactive && year < PLAN_MAX_YEAR ? <PlannerYearEdge side="next" year={year + 1} expanded={showNext} ready={ready} onExpand={() => expandMonth(nextMonthKey)}>
            {renderMonth(calendar[11])}{showNext && renderMonth(visibleCalendar[visibleCalendar.length - 1])}
          </PlannerYearEdge> : renderMonth(calendar[11]) }
        ]} />
        {interactive && plan.school.enabled && <PlannerSchoolPanel year={year} school={plan.school} />}
      </div>
      {interactive && <aside id="plan-summary" className="plan-summary" aria-labelledby="plan-summary-heading"><div className="plan-summary-sticky"><div className="plan-summary-overview"><h2 id="plan-summary-heading">Podsumowanie urlopu</h2><div className="plan-total" aria-live="polite" aria-atomic="true"><strong>{result.used}<span> dni urlopu w {year}</span></strong><span className="plan-equals" aria-hidden="true">↓</span><strong>{result.total}<span> dni w Twoich przerwach</span></strong>{result.donationWorkdays > 0 && <p>+ {result.donationWorkdays} dni roboczych zwolnienia za donacje</p>}</div><div className="plan-longest"><span>Najdłużej bez pracy</span><strong>{result.longest} dni ciągiem</strong></div></div>
        {otherYears.length > 0 && <div className="plan-other-years" aria-label="Urlop w sąsiednich latach"><h3>Masz też plan na inne lata</h3>{otherYears.map(([otherYear, analysis]) => <button type="button" key={otherYear} onClick={() => switchYear(otherYear, `${otherYear}-${otherYear < year ? '12' : '01'}-01`)}><span><strong>{otherYear}</strong><span>{analysis.used} z {plan.budgets[otherYear] ?? 26} dni urlopu{analysis.donationWorkdays > 0 ? ` · ${analysis.donationWorkdays} dni za donacje` : ''}</span>{analysis.used > (plan.budgets[otherYear] ?? 26) && <small>Przekroczona pula o {analysis.used - (plan.budgets[otherYear] ?? 26)} dni</small>}</span><span aria-hidden="true">→</span></button>)}</div>}
        <details className="plan-summary-details"><summary>{result.breaks.length ? `Twoje przerwy (${result.breaks.length})` : 'Sprawdź proponowane mostki'}<span aria-hidden="true">⌄</span></summary>
        {result.overlap > 0 && <p className="plan-notice">Donacja pokrywa {result.overlap} zaznaczonych dni urlopu. Nie odejmujemy ich z puli. Po usunięciu donacji urlop wróci do bilansu.</p>}
        {result.breaks.length ? <div className="plan-breaks"><h3>Twoje przerwy <span>{result.breaks.length}</span></h3>{result.breaks.map(b => <div className="plan-break" key={b.start}><strong>{displayRange(b.start, b.end)}</strong><p>{b.leave} dni urlopu{b.donation > 0 ? ` + ${b.donation} dni za donację` : ''} <span>→ {b.days} dni wolnego</span></p>{b.start.slice(0, 4) !== b.end.slice(0, 4) && <div className="plan-break-years">{Object.entries(b.byYear).map(([costYear, costs]) => <span key={costYear}><b>{costYear}</b>: {costs.leave} dni urlopu{costs.donation > 0 ? ` + ${costs.donation} za donacje` : ''}</span>)}</div>}</div>)}</div> : <div className="plan-empty"><span aria-hidden="true">☀</span><h3>Wolne miejsce na wolne.</h3><p>Zaznacz pierwszy dzień. Albo sprawdź gotowy mostek:</p>{suggestions.map(s => <button key={s.id} disabled={!ready} onClick={() => addLeave(s.vacationDays.map(formatDateKey))}><strong>{displayRange(formatDateKey(s.startDate), formatDateKey(s.endDate))}</strong><span>{s.daysToTake} dni urlopu → {s.freeDays} dni wolnego ＋</span></button>)}</div>}
        <p className="plan-count-note">Liczymy pracę pn–pt. Pula dotyczy {year}; przerwa może obejmować sąsiedni rok. Naturalne weekendy bez Twoich zaznaczeń nie wchodzą do bilansu.</p>
        </details>
      </div></aside>}
    </div>
    {interactive && <button className="plan-mobile-balance" onClick={() => document.getElementById('plan-summary')?.scrollIntoView({ block: 'start' })} aria-label="Przejdź do podsumowania urlopu"><span><strong>{result.used}</strong> dni urlopu · {year}{result.donationWorkdays > 0 ? ` + ${result.donationWorkdays} za donacje` : ''}</span><span>→ <strong>{result.total}</strong> dni wolnego <span aria-hidden="true">↓</span></span></button>}
    {!embedded && <>
    <PlannerDonations plan={plan} year={year} planningDate={planningDate} ready={ready} onChange={update} />
    <PlanningFaq title="Wolne od wątpliwości." intro="Planer urlopu, który pamięta Twój plan." items={[
      { question: 'Gdzie zapisuje się mój plan bez konta?', answer: <p>W pamięci tej przeglądarki na tym urządzeniu, po każdej zmianie. Nie wysyłamy zaznaczonych dat ani donacji do serwera lub analityki. Wyczyszczenie danych strony lub zamknięcie trybu prywatnego może usunąć plan.</p> },
      { question: 'Skąd więcej dni wolnego niż dni urlopu?', answer: <p>Urlop pokrywa dni, w których normalnie pracujesz. Planer łączy go z sąsiednimi weekendami, świętami i zaznaczonym zwolnieniem za donację. Dwie stykające się przerwy stają się jednym ciągiem. Żaden dzień nie jest liczony dwa razy.</p> },
      { question: 'Czy tryb uczniowski zmienia mój urlop?', answer: <p>Nie. Pokazuje ferie Twojego województwa i wakacje, żeby ułatwić wspólny wyjazd. Rodzic nadal potrzebuje urlopu w dni robocze. Terminy pobieramy z Ministerstwa Edukacji Narodowej; brak potwierdzonych danych sygnalizujemy wprost.</p> },
      { question: 'Jak zaplanować urlop na przełomie roku?', answer: <p>Zakładka przy styczniu rozwija grudzień poprzedniego roku, a zakładka przy grudniu — styczeń kolejnego. Krzyżyk w rogu dodatkowego miesiąca pozwala go schować. Zaznaczasz dni w jednym planie. Każdy dzień urlopu obciąża pulę roku, do którego należy; długość przerwy obejmuje cały ciąg wolnego. Po zmianie roku zobaczysz zapisane wcześniej daty, a przy przerwie na przełomie lat — rozbicie urlopu na lata. Rozwinięcie lub schowanie miesiąca nie zmienia planu.</p> },
      { question: 'Co z odbiorem za sobotę i pracą zmianową?', answer: <p>Ten planer zakłada pracę od poniedziałku do piątku i nie przydziela automatycznie wolnego za święto w sobotę. Termin odbioru ustal z pracodawcą. Przy innym grafiku sprawdź wynik w swoim harmonogramie. Pulę urlopu wpisujesz samodzielnie — planer nie ustala uprawnień pracowniczych.</p> },
      { question: 'Jak usunąć zaznaczenia lub zresetować rok?', answer: <p>Kliknij zaznaczony dzień ponownie albo usuń wpis z listy donacji. „Resetuj” usuwa dni urlopu i donacje zapisane w bieżącym roku. Zachowuje pulę urlopu, województwo, profil dawcy i plany na inne lata. Donacja z końca poprzedniego roku może nadal oznaczać wolne na początku bieżącego.</p> }
    ]} />
    </>}
  </div>;
}
