import React, { useMemo, useRef, useState } from 'react';
import { calculateLeave, CALCULATOR_MIN_YEAR } from '../utils/leaveCalculator';
import { formatDateKey } from '../utils/dateUtils';
import { YEAR_MAX, yearPath } from '../utils/seo';
import { displayRange, displayLeaveDates, getVacationSuggestions } from '../utils/vacationSuggestions';

export function LeaveCalculator({ planningDate }: { planningDate: string }) {
  const year = Number(planningDate.slice(0, 4));
  const [maxLeave, setMaxLeave] = useState(3);
  const [draft, setDraft] = useState<{ start: string; end: string } | null>(null);
  const suggestions = useMemo(() => getVacationSuggestions(year, planningDate, maxLeave), [year, planningDate, maxLeave]);
  const startInput = useRef<HTMLInputElement>(null);
  const defaultEnd = new Date(`${planningDate}T12:00:00`);
  defaultEnd.setDate(defaultEnd.getDate() + 6);
  const selected = draft ?? (suggestions[0] ? { start: formatDateKey(suggestions[0].startDate), end: formatDateKey(suggestions[0].endDate) } : { start: planningDate, end: formatDateKey(defaultEnd) > `${YEAR_MAX}-12-31` ? `${YEAR_MAX}-12-31` : formatDateKey(defaultEnd) });
  let result: ReturnType<typeof calculateLeave> | undefined;
  let error = '';
  try { result = calculateLeave(selected.start, selected.end); } catch (e) { error = (e as Error).message; }
  const bonus = result ? result.totalDays - result.leaveDays : 0;
  const reaction = !result ? 'Plan do małej poprawki.' : result.leaveDays === 0 ? 'Nie robię. Urlopu nie ruszam.' : bonus === 0 ? 'Dołóż weekend do nierobienia.' : bonus >= result.leaveDays ? 'Nierobienie dobrze się składa.' : 'Mój status? Nie robię.';

  return <div className="vacation-lab">
    <section className="leave-playground" aria-labelledby="calculator-heading">
      <div className="leave-controls">
        <div className="leave-step"><span>01 / PLAN NA NIEROBIENIE</span><span aria-hidden="true">↗</span></div>
        <h2 id="calculator-heading">Kiedy nie robisz?</h2>
        <p>Ty planujesz nie robić. My robimy rachunki. Wpisz daty albo wybierz okazję poniżej.</p>
        <div className="leave-date-fields">
          <label>Początek wypoczynku<input ref={startInput} type="date" min={`${CALCULATOR_MIN_YEAR}-01-01`} max={`${YEAR_MAX}-12-31`} value={selected.start} aria-invalid={!!error} aria-describedby={error ? 'leave-error' : undefined} onChange={e => setDraft({ ...selected, start: e.target.value })} /></label>
          <label>Koniec wypoczynku<input type="date" min={`${CALCULATOR_MIN_YEAR}-01-01`} max={`${YEAR_MAX}-12-31`} value={selected.end} aria-invalid={!!error} aria-describedby={error ? 'leave-error' : undefined} onChange={e => setDraft({ ...selected, end: e.target.value })} /></label>
        </div>
        <div className="leave-equation" aria-hidden="true"><span>Twój urlop</span><b>+</b><span>weekendy i święta</span><b>=</b><span className="leave-equation-end">więcej nierobienia</span></div>
        <p className="leave-smallprint">Obie daty wliczamy do wyniku. Liczymy dla pracy od poniedziałku do piątku.</p>
      </div>
      <div className="leave-ticket" aria-live="polite" aria-atomic="true">
        <div className="leave-step"><span>TYLE MOŻESZ NIE ROBIĆ</span><span className="leave-stamp" aria-hidden="true">OFF</span></div>
        {error ? <div className="leave-error" id="leave-error"><span aria-hidden="true">↺</span><h3>Jeszcze raz, na spokojnie.</h3><p>{error}</p></div> : result && <>
          <div className="leave-total" key={result.totalDays}>{result.totalDays}<span>dni<br />wypoczynku</span></div>
          <p className="leave-cost"><strong>{result.leaveDays}</strong> dni urlopu <span>+ {bonus} dni bez zużycia urlopu</span></p>
          <div className="leave-breakdown" aria-hidden="true">
            {result.leaveDays > 0 && <span className="leave-segment-paid" style={{ flex: result.leaveDays }} />}
            {result.weekends > 0 && <span className="leave-segment-weekend" style={{ flex: result.weekends }} />}
            {result.holidaysOnWeekdays > 0 && <span className="leave-segment-holiday" style={{ flex: result.holidaysOnWeekdays }} />}
          </div>
          <p className="leave-breakdown-label">Urlop: {result.leaveDays} · Weekendy: {result.weekends} · Święta w dni robocze: {result.holidaysOnWeekdays}</p>
          <p className="sr-only">{result.leaveDays} dni urlopu na {result.totalDays} dni wypoczynku.</p>
        </>}
        <div className="leave-ticket-bottom"><span>{reaction}</span><span aria-hidden="true" className="leave-smile">☺</span></div>
      </div>
    </section>

    <section className="leave-opportunities" aria-labelledby="opportunities-heading">
      <div className="leave-opportunities-heading"><div><p className="leave-eyebrow">02 / NIEROBIENIE SIĘ SKŁADA</p><h2 id="opportunities-heading">Mniej urlopu. Więcej „nie robię”.</h2><p>Nie rób, kiedy się opłaca. Oto korzystne terminy, które jeszcze przed Tobą w {year} roku.</p></div><a className="leave-text-link" href={`${yearPath(year)}#planer-urlopu`}>Wszystkie okazje {year} <span aria-hidden="true">↗</span></a></div>
      <div className="leave-budgets" role="group" aria-label="Maksymalna liczba dni urlopu"><span>Mogę wziąć do:</span>{[1, 3, 5, 10].map(days => <button key={days} type="button" aria-pressed={maxLeave === days} onClick={() => setMaxLeave(days)}>{days} {days === 1 ? 'dnia' : 'dni'}<span className="sr-only"> urlopu</span></button>)}</div>
      <div className="leave-suggestion-grid">
        {suggestions.map((suggestion, index) => {
          const start = formatDateKey(suggestion.startDate), end = formatDateKey(suggestion.endDate);
          const isSelected = selected.start === start && selected.end === end;
          return <article key={suggestion.id} className={`leave-suggestion leave-suggestion-${index}${isSelected ? ' is-selected' : ''}`} data-start={start} data-end={end}>
            <div className="leave-suggestion-top"><span>{suggestion.periodName || 'Czas na przerwę'}</span><span aria-hidden="true">{['✦', '↗', '☀'][index]}</span></div>
            <div className="leave-deal"><div><strong>{suggestion.daysToTake}</strong><span>dni urlopu</span></div><span className="leave-deal-arrow" aria-hidden="true">→</span><div><strong>{suggestion.freeDays}</strong><span>dni wolnego</span></div></div>
            <p className="leave-suggestion-range">{displayRange(suggestion.startDate, suggestion.endDate)}</p>
            <p className="leave-suggestion-dates"><strong>Wniosek o urlop:</strong> {displayLeaveDates(suggestion.vacationDays)}.</p>
            <button type="button" aria-pressed={isSelected} onClick={() => { setDraft({ start, end }); startInput.current?.focus({ preventScroll: true }); startInput.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' }); }}>{isSelected ? 'Ten termin jest w kalkulatorze' : 'W te dni nie robię'}<span aria-hidden="true">{isSelected ? '✓' : '↗'}</span></button>
          </article>;
        })}
      </div>
      {suggestions.length === 0 && <div className="leave-empty"><span aria-hidden="true">☀</span><h3>Ten limit ma już wolne.</h3><p>Nie znaleźliśmy kolejnej propozycji na co najmniej 3 dni wypoczynku w {year} roku. Zwiększ limit urlopu albo wybierz własne daty powyżej.</p>{year < YEAR_MAX && <a href={yearPath(year + 1)}>Podejrzyj okazje na {year + 1} →</a>}</div>}
      <p className="leave-method">Najpierw pokazujemy najdłuższy wypoczynek w Twoim limicie. Przy tej samej długości wygrywa mniejsze zużycie urlopu. Wybieramy różne, niepokrywające się terminy. Dni odbioru za sobotnie święta ustalasz z pracodawcą — nie doliczamy ich do tych propozycji.</p>
      <noscript><p>To propozycje aktualne na dzień przygotowania strony. Włącz JavaScript, aby zmienić limit, wybrać propozycję lub przeliczyć własne daty.</p></noscript>
    </section>
    <a className="leave-year-cta" href={yearPath(year)}><div><span>NIEROBIENIE W PLANACH?</span><strong>Nie robię w {year}. A Ty?</strong><p>Otwórz kalendarz: święta, długie weekendy i plan na więcej wolnego.</p></div><span className="leave-year-arrow" aria-hidden="true">↗</span></a>
  </div>;
}
