import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { formatDateKey, generateCalendarData } from '../utils/dateUtils';
import { LEAVE_WAVE } from '../utils/calendarVisuals';
import { DonationIcon } from './Icons';
import { getPlanningDate, getVacationSuggestions } from '../utils/vacationSuggestions';
import { PlanningFaq } from './PlanningFaq';
import { PlannerSchoolPanel } from './PlannerSchoolPanel';
import { PlannerMonth } from './PlannerMonth';
import { PlannerYearEdge } from './PlannerYearEdge';
import { PlannerDonations } from './PlannerDonations';
import { assertDonationPlan, donationCandidateIssue, donationIssues } from '../utils/donationRules';
import { analyzePlan, displayDate, displayRange, emptyPlan, donationDays, isWorkday, mergePlans, parsePlan, parsePlannerHash, plannerHref, PLAN_KEY, PLAN_MAX_YEAR, PLAN_MIN_YEAR, shiftDay, type PersonalPlan } from '../utils/personalPlan';

type Tool = 'leave' | 'blood' | 'plasma';
const toolLabels: Record<Tool, string> = { leave: 'Urlop', blood: 'Krew', plasma: 'Osocze' };
function saveFile(content: string, name: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json;charset=utf-8' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function PersonalPlanner({ planningDate }: { planningDate: string }) {
  const initialYear = Math.min(PLAN_MAX_YEAR, Math.max(PLAN_MIN_YEAR, Number(planningDate.slice(0, 4))));
  const [year, setYear] = useState(initialYear);
  const [plan, setPlan] = useState<PersonalPlan>(emptyPlan);
  const [previous, setPrevious] = useState<PersonalPlan | null>(null);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState('Odczytuję Twój plan…');
  const [message, setMessage] = useState('');
  const [jumpDate, setJumpDate] = useState('');
  const [tool, setTool] = useState<Tool>('leave');
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const calendarElement = useRef<HTMLDivElement>(null);
  const monthPositions = useRef<Map<string, { left: number; top: number; width: number }> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const canPersist = useRef(true);
  const initialized = useRef(false);
  const calendar = useMemo(() => generateCalendarData(year), [year]);
  const resultsByYear = useMemo(() => new Map([year - 1, year, year + 1]
    .filter(y => y >= PLAN_MIN_YEAR && y <= PLAN_MAX_YEAR)
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
      setSaved('Zapis niedostępny — pobierz kopię planu');
      setMessage('Nie udało się odczytać pamięci przeglądarki. Możesz planować i pobrać kopię. Istniejący zapis pozostaje bez zmian.');
    }
    const incoming = parsePlannerHash(window.location.hash, Number(getPlanningDate().slice(0, 4)));
    setYear(incoming.year);
    const donorDates = donationDays(restored);
    const added = incoming.dates.filter(date => !restored.leave.includes(date) && !donorDates.has(date));
    if (added.length) {
      const next = { ...restored, leave: [...restored.leave, ...added].sort() };
      setPrevious(restored); setPlan(next); persist(next);
      setMessage(`Dodano mostek ze strategii: ${added.length} dni urlopu. Możesz cofnąć tę zmianę.`);
    } else {
      setPlan(restored);
      if (incoming.dates.length) setMessage('Ten mostek jest już w Twoim planie.');
      else if (donationIssues(restored.donations, restored.donorProfile).length) setMessage('Zapisany plan zawiera kolidujące donacje. Popraw oznaczone wpisy w sekcji donacji.');
    }
    if (incoming.dates.length) { window.history.replaceState(null, '', plannerHref(incoming.year)); setJumpDate(incoming.dates.find(date => date.startsWith(`${incoming.year}-`)) ?? incoming.dates[0]); }
    setReady(true);
  }, [planningDate]);

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
    if (!ready) return;
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
    catch { setSaved('Zapis niedostępny — pobierz kopię planu'); }
  }
  function update(next: PersonalPlan, note = '') {
    setPrevious(plan); setPlan(next); persist(next); setMessage(note);
  }
  function switchYear(next: number, date?: string) {
    if (next < PLAN_MIN_YEAR || next > PLAN_MAX_YEAR) return;
    setYear(next); setMessage('');
    if (date) setJumpDate(date);
    window.history.replaceState(null, '', plannerHref(next));
  }
  function addLeave(dates: string[]) {
    const newDates = dates.filter(date => !leave.has(date) && !result.donated.has(date));
    update({ ...plan, leave: [...new Set([...plan.leave, ...newDates])].sort() }, newDates.length ? `Dodano dni urlopu: ${newDates.length}.${newDates.some(date => !date.startsWith(`${year}-`)) ? ' Dni spoza tego roku zapisano w puli właściwego roku.' : ' Mostki już policzone.'}` : 'Te dni są już w planie lub pokrywa je donacja.');
  }
  function selectDay(key: string) {
    if (tool === 'leave') {
      if (leave.has(key)) update({ ...plan, leave: plan.leave.filter(d => d !== key) });
      else if (isWorkday(key) && !result.donated.has(key)) addLeave([key]);
    } else {
      const existing = plan.donations.find(d => d.date === key);
      if (!existing) {
        const issue = donationCandidateIssue(plan, { date: key, type: tool });
        if (issue) { setMessage(issue); return; }
      }
      update({ ...plan, donations: existing ? plan.donations.filter(d => d.date !== key) : [...plan.donations, { date: key, type: tool }].sort((a, b) => a.date.localeCompare(b.date)) }, existing ? 'Usunięto planowaną donację.' : `Planowana donacja: ${displayDate(key)}. Zaznaczono też następny dzień kalendarzowy.`);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 500_000) throw new Error('Plik jest za duży. Wybierz kopię JSON do 500 kB.');
      const incoming = parsePlan(await file.text());
      const merged = mergePlans(plan, incoming);
      assertDonationPlan(merged);
      update(merged, 'Połączono kopię z Twoim planem. Możesz cofnąć tę zmianę.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Nie udało się wczytać kopii.'); }
    finally { if (fileInput.current) fileInput.current.value = ''; }
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
  const renderMonth = (month: (typeof calendar)[number]) => <PlannerMonth key={`${month.year}-${month.monthIndex}`} month={month} activeYear={year} plan={plan} leave={leave} donated={result.donated} breakDates={breakDates} blockedDonations={blockedDonations} tool={tool} ready={ready} planningDate={planningDate} onSelect={selectDay} onSwitchYear={switchYear} onClose={month.year !== year ? () => closeMonth(month) : undefined} />;

  return <div className="personal-planner">
    <section className="plan-hero" aria-labelledby="plan-heading">
      <div><p className="leave-eyebrow">OSOBISTY PLANER URLOPU · BEZ KONTA</p><h1 id="plan-heading">Mój plan<br /><span>nierobienia.</span></h1><p>Zaplanuj przerwy od pracy na cały rok. Zaznacz urlop w kalendarzu — połączymy go z weekendami i świętami, policzymy dni wolnego i zapiszemy Twój plan w tej przeglądarce.</p><div className="plan-pills"><span>Bez konta</span><span>Bez opłat</span><span>Zapis na tym urządzeniu</span></div></div>
      <div className="plan-hero-note"><span>WEEKEND TO DOPIERO POCZĄTEK</span><strong>Wolne nie musi kończyć się <em>w niedzielę.</em></strong><ol><li><b>01</b> Zaznaczasz dni urlopu.</li><li><b>02</b> Widzisz, ile wolnego tworzą.</li><li><b>03</b> Wracasz do zapisanego planu.</li></ol></div>
    </section>
    <noscript><p className="plan-notice">Włącz JavaScript, aby zaznaczać dni i zapisywać plan. Kalendarz i informacje poniżej są dostępne bez niego.</p></noscript>
    <div className="plan-topbar">
      <div className="plan-year"><button disabled={!ready || year === PLAN_MIN_YEAR} onClick={() => switchYear(year - 1)} aria-label="Poprzedni rok planu">←</button><label className="sr-only" htmlFor="plan-year">Rok planu</label><select id="plan-year" value={year} disabled={!ready} onChange={e => switchYear(+e.target.value)}>{Array.from({ length: PLAN_MAX_YEAR - PLAN_MIN_YEAR + 1 }, (_, i) => <option key={i}>{PLAN_MIN_YEAR + i}</option>)}</select><button disabled={!ready || year === PLAN_MAX_YEAR} onClick={() => switchYear(year + 1)} aria-label="Następny rok planu">→</button></div>
      <p className="plan-save-status" role="status">{saved}</p>
      <div className="plan-actions"><button disabled={!previous || !ready} onClick={() => { if (previous) { setPlan(previous); persist(previous); setPrevious(null); setMessage('Cofnięto ostatnią zmianę.'); } }}>↶ Cofnij</button><button disabled={!ready} onClick={() => saveFile(JSON.stringify(plan, null, 2), 'moj-plan-nierobienia.json')}>Pobierz kopię ↓</button><button disabled={!ready} onClick={() => fileInput.current?.click()}>Wczytaj kopię</button><input ref={fileInput} type="file" accept=".json,application/json" aria-label="Plik kopii planu" hidden onChange={e => void importFile(e.target.files?.[0])} /></div>
    </div>

    <div className="plan-feedback" role="status">{message && <><span>{message}</span><button type="button" aria-label="Zamknij komunikat" onClick={() => setMessage('')}>×</button></>}</div>
    <div className="plan-workspace">
      <div className="plan-calendar-panel">
        <div className="plan-calendar-title"><div><p className="leave-eyebrow">01 / ZAZNACZ SWOJE WOLNE</p><h2>Tu mnie nie ma.</h2></div><a href={`/${year}/`}>Święta i strategie {year} ↗</a></div>
        <div className="plan-tools"><div role="group" aria-label="Co zaznaczasz w kalendarzu">{(['leave', 'blood', 'plasma'] as Tool[]).map(t => <button key={t} disabled={!ready} aria-pressed={tool === t} onClick={() => setTool(t)}>{t === 'leave' ? '＋' : '♡'} {toolLabels[t]}</button>)}</div><label className="plan-school-toggle"><input type="checkbox" checked={plan.school.enabled} disabled={!ready} onChange={e => update({ ...plan, school: { ...plan.school, enabled: e.target.checked } })} /> Tryb uczniowski</label></div>
        <p className="plan-help">{tool === 'leave' ? 'Kliknij dzień roboczy, żeby dodać urlop. Kliknij ponownie, żeby go usunąć.' : `Zaznaczasz: ${tool === 'blood' ? 'oddanie krwi' : 'oddanie osocza'}. Kliknij dzień planowanej donacji. Ponowne kliknięcie usuwa wpis.`}</p>
        {tool !== 'leave' && <p className="plan-donation-help">Przekreślone daty nie spełniają odstępów lub limitów donacji. Kliknij je, żeby poznać powód. <button type="button" className="plan-text-link" onClick={() => document.getElementById('donacje-info')?.scrollIntoView({ block: 'start' })}>Twój profil, historia i limity ↓</button></p>}
        {plan.school.enabled && <PlannerSchoolPanel year={year} school={plan.school} onChange={school => update({ ...plan, school })} />}
        <div className="plan-legend" aria-label="Legenda kalendarza" style={{ '--plan-leave-wave': LEAVE_WAVE } as React.CSSProperties}><span><i className="plan-swatch-leave" />Twój urlop</span><span><i className="plan-swatch-free" />Twój ciąg wolnego</span><span><i className="plan-swatch-weekend" />Weekend</span><span><i className="plan-swatch-holiday" />Święto</span><span><i className="plan-swatch-donation"><DonationIcon /></i>Donacja + dzień po</span>{plan.school.enabled && <><span><i className="plan-swatch-winter" />Ferie zimowe</span><span><i className="plan-swatch-summer" />Wakacje</span></>}</div>
        <div className="plan-months" ref={calendarElement} style={{ '--plan-leave-wave': LEAVE_WAVE } as React.CSSProperties}>
          {year > PLAN_MIN_YEAR ? <PlannerYearEdge side="previous" year={year - 1} expanded={showPrevious} ready={ready} onExpand={() => expandMonth(previousMonthKey)}>
            {showPrevious && renderMonth(visibleCalendar[0])}{renderMonth(calendar[0])}
          </PlannerYearEdge> : renderMonth(calendar[0])}
          {calendar.slice(1, -1).map(renderMonth)}
          {year < PLAN_MAX_YEAR ? <PlannerYearEdge side="next" year={year + 1} expanded={showNext} ready={ready} onExpand={() => expandMonth(nextMonthKey)}>
            {renderMonth(calendar[11])}{showNext && renderMonth(visibleCalendar[visibleCalendar.length - 1])}
          </PlannerYearEdge> : renderMonth(calendar[11])}
        </div>

      </div>
      <aside id="plan-summary" className="plan-summary" aria-labelledby="plan-summary-heading"><div className="plan-summary-sticky"><p className="leave-eyebrow">02 / TYLE DOBREGO NIC</p><h2 id="plan-summary-heading">Bilans nierobienia</h2><div className="plan-total" aria-live="polite" aria-atomic="true"><strong>{result.used}<span> dni urlopu w {year}</span></strong><span className="plan-equals" aria-hidden="true">↓</span><strong>{result.total}<span> dni w Twoich przerwach</span></strong>{result.donationWorkdays > 0 && <p>+ {result.donationWorkdays} dni roboczych zwolnienia za donacje</p>}</div><div className="plan-longest"><span>Najdłużej bez pracy</span><strong>{result.longest} dni ciągiem</strong></div><label className="plan-budget">Moja pula na {year}<span><input aria-label="Roczna pula urlopu" type="number" min="0" max="366" value={budget} disabled={!ready} onChange={e => { const value = e.target.valueAsNumber; if (Number.isInteger(value) && value >= 0 && value <= 366) update({ ...plan, budgets: { ...plan.budgets, [year]: value } }); }} /> dni</span></label><p className={budget < result.used ? 'plan-over-budget' : 'plan-remaining'}>{budget < result.used ? `Przekraczasz pulę o ${result.used - budget} dni.` : `Jeszcze ${budget - result.used} dni do rozdania.`}</p><meter min="0" max={Math.max(1, budget, result.used)} value={result.used} aria-label="Wykorzystanie puli urlopu" /><p className="plan-count-note">Liczymy pracę pn–pt. Pula dotyczy {year}; przerwa może obejmować sąsiedni rok. Naturalne weekendy bez Twoich zaznaczeń nie wchodzą do bilansu.</p>
        {otherYears.length > 0 && <div className="plan-other-years" aria-label="Urlop w sąsiednich latach"><h3>Masz też plan na inne lata</h3>{otherYears.map(([otherYear, analysis]) => <button type="button" key={otherYear} onClick={() => switchYear(otherYear, `${otherYear}-${otherYear < year ? '12' : '01'}-01`)}><span><strong>{otherYear}</strong><span>{analysis.used} z {plan.budgets[otherYear] ?? 26} dni urlopu{analysis.donationWorkdays > 0 ? ` · ${analysis.donationWorkdays} dni za donacje` : ''}</span>{analysis.used > (plan.budgets[otherYear] ?? 26) && <small>Przekroczona pula o {analysis.used - (plan.budgets[otherYear] ?? 26)} dni</small>}</span><span aria-hidden="true">→</span></button>)}</div>}
        {result.overlap > 0 && <p className="plan-notice">Donacja pokrywa {result.overlap} zaznaczonych dni urlopu. Nie odejmujemy ich z puli. Po usunięciu donacji urlop wróci do bilansu.</p>}
        {result.breaks.length ? <div className="plan-breaks"><h3>Twoje przerwy <span>{result.breaks.length}</span></h3>{result.breaks.map(b => <div className="plan-break" key={b.start}><strong>{displayRange(b.start, b.end)}</strong><p>{b.leave} dni urlopu{b.donation > 0 ? ` + ${b.donation} dni za donację` : ''} <span>→ {b.days} dni wolnego</span></p>{b.start.slice(0, 4) !== b.end.slice(0, 4) && <div className="plan-break-years">{Object.entries(b.byYear).map(([costYear, costs]) => <span key={costYear}><b>{costYear}</b>: {costs.leave} dni urlopu{costs.donation > 0 ? ` + ${costs.donation} za donacje` : ''}</span>)}</div>}</div>)}</div> : <div className="plan-empty"><span aria-hidden="true">☀</span><h3>Wolne miejsce na wolne.</h3><p>Zaznacz pierwszy dzień. Albo sprawdź gotowy mostek:</p>{suggestions.map(s => <button key={s.id} disabled={!ready} onClick={() => addLeave(s.vacationDays.map(formatDateKey))}><strong>{displayRange(formatDateKey(s.startDate), formatDateKey(s.endDate))}</strong><span>{s.daysToTake} dni urlopu → {s.freeDays} dni wolnego ＋</span></button>)}</div>}
      </div></aside>
    </div>
    <button className="plan-mobile-balance" onClick={() => document.getElementById('plan-summary')?.scrollIntoView({ block: 'start' })} aria-label="Przejdź do bilansu nierobienia"><span><strong>{result.used}</strong> dni urlopu · {year}{result.donationWorkdays > 0 ? ` + ${result.donationWorkdays} za donacje` : ''}</span><span>→ <strong>{result.total}</strong> dni wolnego <span aria-hidden="true">↑</span></span></button>
    <PlannerDonations plan={plan} year={year} planningDate={planningDate} ready={ready} onChange={update} />
    <PlanningFaq title="Wolne od wątpliwości." intro="Kalkulator dni urlopu, który pamięta Twój plan." items={[
      { question: 'Gdzie zapisuje się mój plan bez konta?', answer: <p>W pamięci tej przeglądarki na tym urządzeniu, po każdej zmianie. Nie wysyłamy zaznaczonych dat ani donacji do serwera lub analityki. Wyczyszczenie danych strony lub zamknięcie trybu prywatnego może usunąć plan. Pobierz kopię JSON, żeby przenieść go na inne urządzenie. Plik zawiera również planowane donacje.</p> },
      { question: 'Skąd więcej dni wolnego niż dni urlopu?', answer: <p>Urlop pokrywa dni, w których normalnie pracujesz. Planer łączy go z sąsiednimi weekendami, świętami i zaznaczonym zwolnieniem za donację. Dwie stykające się przerwy stają się jednym ciągiem. Żaden dzień nie jest liczony dwa razy.</p> },
      { question: 'Czy tryb uczniowski zmienia mój urlop?', answer: <p>Nie. Pokazuje ferie Twojego województwa i wakacje, żeby ułatwić wspólny wyjazd. Rodzic nadal potrzebuje urlopu w dni robocze. Terminy pobieramy z Ministerstwa Edukacji Narodowej; brak potwierdzonych danych sygnalizujemy wprost.</p> },
      { question: 'Jak zaplanować urlop na przełomie roku?', answer: <p>Zakładka przy styczniu rozwija grudzień poprzedniego roku, a zakładka przy grudniu — styczeń kolejnego. Krzyżyk w rogu dodatkowego miesiąca pozwala go schować. Zaznaczasz dni w jednym planie. Każdy dzień urlopu obciąża pulę roku, do którego należy; długość przerwy obejmuje cały ciąg wolnego. Po zmianie roku zobaczysz zapisane wcześniej daty, a przy przerwie na przełomie lat — rozbicie urlopu na lata. Rozwinięcie lub schowanie miesiąca nie zmienia planu.</p> },
      { question: 'Co z odbiorem za sobotę i pracą zmianową?', answer: <p>Ten planer zakłada pracę od poniedziałku do piątku i nie przydziela automatycznie wolnego za święto w sobotę. Termin odbioru ustal z pracodawcą. Przy innym grafiku sprawdź wynik w swoim harmonogramie. Pulę urlopu wpisujesz samodzielnie — planer nie ustala uprawnień pracowniczych.</p> },
      { question: 'Jak usunąć zaznaczenia lub odzyskać plan?', answer: <p>Kliknij zaznaczony dzień ponownie albo usuń wpis z listy donacji. „Cofnij” odwraca ostatnią zmianę w bieżącej sesji. Wczytanie kopii scala daty z obecnym planem, zachowując Twoją aktualną pulę urlopu. Kopia obejmuje wszystkie lata.</p> }
    ]} />
  </div>;
}
