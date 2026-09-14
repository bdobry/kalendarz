import React, { useState } from 'react';
import { calculateLeave, CALCULATOR_MIN_YEAR } from '../utils/leaveCalculator';
import { YEAR_MAX } from '../utils/seo';
export function LeaveCalculator({ buildYear }: { buildYear: number }) {
  const [start, setStart] = useState(`${buildYear}-07-01`);
  const [end, setEnd] = useState(`${buildYear}-07-14`);
  let result: ReturnType<typeof calculateLeave> | undefined;
  let error = '';
  try { result = calculateLeave(start, end); } catch (e) { error = (e as Error).message; }
  return <section aria-labelledby="calculator-heading" className="bg-white border border-brand-200 rounded-2xl p-6 sm:p-8 my-8">
    <h2 id="calculator-heading" className="text-2xl font-bold mb-5">Ile dni urlopu potrzebujesz?</h2>
    <div className="grid sm:grid-cols-2 gap-5">
      <label className="font-medium">Początek wypoczynku<input className="block border border-neutral-300 rounded-lg p-3 mt-2 w-full" type="date" min={`${CALCULATOR_MIN_YEAR}-01-01`} max={`${YEAR_MAX}-12-31`} value={start} onChange={e => setStart(e.target.value)} /></label>
      <label className="font-medium">Koniec wypoczynku<input className="block border border-neutral-300 rounded-lg p-3 mt-2 w-full" type="date" min={`${CALCULATOR_MIN_YEAR}-01-01`} max={`${YEAR_MAX}-12-31`} value={end} onChange={e => setEnd(e.target.value)} /></label>
    </div>
    <div aria-live="polite" aria-atomic="true" className="mt-6">
      {error ? <p className="text-rose-700">{error}</p> : result && <>
        <p className="text-xl"><strong className="text-brand-700 text-3xl">{result.leaveDays}</strong> dni urlopu na <strong>{result.totalDays} dni wypoczynku</strong>.</p>
        <p className="text-neutral-600 mt-2">W tym: {result.weekends} dni weekendowych i {result.holidaysOnWeekdays} świąt od poniedziałku do piątku.</p>
      </>}
    </div>
    <p className="text-sm text-neutral-500 mt-5">Liczymy oba wskazane dni włącznie, dla pracy od poniedziałku do piątku. Święto w weekend nie jest liczone podwójnie. Dodatkowy dzień wolny za święto w sobotę zależy od terminu ustalonego przez pracodawcę i nie jest odejmowany automatycznie.</p>
    <noscript><p className="mt-4">Powyżej widzisz przykład dla 1–14 lipca {buildYear}. Włącz JavaScript, aby przeliczyć własne daty. Kalendarze świąt są dostępne także bez JavaScript.</p></noscript>
  </section>;
}
