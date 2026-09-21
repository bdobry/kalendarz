import React, { useId, useState } from 'react';
import { getStrategyInsights, STRATEGY_REFERENCE_START, STRATEGY_REFERENCE_END } from '../utils/strategyInsights';
import type { VacationOpportunity } from '../utils/vacationStrategyUtils';

export function StrategyBadges({ strategy }: { strategy: VacationOpportunity }) {
  const info = getStrategyInsights(strategy);
  const id = useId();
  const [open, setOpen] = useState(false);
  if (!info) return null;
  const number = (value: number) => value.toLocaleString('pl-PL', { maximumFractionDigits: 2 });
  return <div className="strategy-insights" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
    <button type="button" className="strategy-insights-trigger" aria-describedby={open ? id : undefined} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen(true)}>
      <span className={`strategy-score${info.isBest ? ' is-best' : ''}`}>Lepszy niż {info.betterThanPercent}% układów</span>
      {info.nextBestYear && <span className="strategy-next-best">{info.isBest ? 'Najlepszy znów' : 'Najlepszy układ'}: {info.nextBestYear}</span>}
      <span className="sr-only"> — jak liczymy korzyść?</span>
    </button>
    <div id={id} role="tooltip" hidden={!open} className="strategy-insights-tooltip bg-neutral-800 text-neutral-200 text-xs p-3 rounded-lg shadow-xl border border-neutral-700">
      <strong>{strategy.periodName} · {number(info.efficiency)}×</strong>
      <p>{number(info.efficiency)} dnia wolnego za 1 dzień urlopu. {info.betterThanPercent}% z {info.sampleCount} wariantów tego okresu ma niższy przelicznik; remisów nie liczymy jako gorszych.</p>
      <p>Porównanie {STRATEGY_REFERENCE_START}–{STRATEGY_REFERENCE_END}, praca pn–pt. Najlepszy przelicznik: {number(info.maxEfficiency)}×{info.nextBestYear ? `, kolejny raz w ${info.nextBestYear}` : '; brak kolejnego roku w zakresie danych'}. Długość przerwy i koszt urlopu mogą być inne.</p>
    </div>
  </div>;
}
