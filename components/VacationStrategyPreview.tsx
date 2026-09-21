import React, { useMemo } from 'react';
import { formatDateKey } from '../utils/dateUtils';
import { displayRange, PLAN_MIN_YEAR } from '../utils/personalPlan';
import { selectStrategyPreview, strategyPlannerHref } from '../utils/strategyPreview';
import type { VacationOpportunity } from '../utils/vacationStrategyUtils';
import { StrategyBadges } from './StrategyBadges';
import { StrategyTimeline } from './StrategyTimeline';
import './vacation-strategy.css';

export function VacationStrategyPreview({ year, strategies }: { year: number; strategies: VacationOpportunity[] }) {
  const canPlan = year >= PLAN_MIN_YEAR;
  const picks = useMemo(() => selectStrategyPreview(strategies, year), [strategies, year]);
  return <section id="planer-urlopu" className="strategy-preview" aria-labelledby="strategy-preview-heading">
    <header className="strategy-preview-heading">
      <div><p className="leave-eyebrow">MAŁY URLOP, DUŻO WOLNEGO</p><h2 id="strategy-preview-heading">Strategia urlopowa {year}</h2><p>Dłuższa przerwa i najlepsze okazje na świąteczne wolne.</p></div>
      <a className="strategy-preview-all" href={canPlan ? strategyPlannerHref(year) : '/kalkulator-urlopu/'}>{canPlan ? 'Pełna strategia w planerze' : 'Otwórz planer urlopu'} <span aria-hidden="true">↗</span></a>
    </header>
    <div className="strategy-preview-grid">{picks.map((strategy, index) => <article className="strategy-preview-card" key={strategy.id} id={`strategy-card-${strategy.id}`}>
      <p className="strategy-preview-pick">{index === 0 && strategy.freeDays >= 14 ? 'Korzystna długa przerwa' : `Najlepszy przelicznik okresu · ${year}`}</p>
      <h3>{strategy.periodName || 'Czas na przerwę'}</h3>
      <p className="strategy-preview-dates">{displayRange(formatDateKey(strategy.startDate), formatDateKey(strategy.endDate))}</p>
      <p className="strategy-preview-equation"><span><b>{strategy.daysToTake}</b><span>dni urlopu</span></span><span aria-hidden="true">→</span><span><b>{strategy.freeDays}</b><span>dni wolnego</span></span></p>
      <StrategyBadges strategy={strategy} />
      <StrategyTimeline strategy={strategy} />
      <a href={canPlan ? strategyPlannerHref(year, strategy) : "/kalkulator-urlopu/"}>{canPlan ? "Zobacz propozycję" : "Zaplanuj kolejny urlop"} <span aria-hidden="true">↗</span></a>
    </article>)}</div>
    <p className="strategy-preview-note">{canPlan ? 'Długa przerwa: najlepszy przelicznik wśród propozycji od 14 dni. Pozostałe: najlepsze warianty różnych okresów w tym roku. Limonka to urlop, fiolet — święto; pozostałe dni to weekend.' : `Historyczne układy dni wolnych z ${year}. Planer pozwala zapisywać urlop od ${PLAN_MIN_YEAR} roku.`}</p>
  </section>;
}
