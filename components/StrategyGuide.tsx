import React from 'react';
import { formatDateKey, getPolishHolidays } from '../utils/dateUtils';
import { displayRange } from '../utils/vacationSuggestions';

export function StrategyGuide({ year }: { year: number }) {
  const corpusKey = [...getPolishHolidays(year)].find(([, name]) => name === 'Boże Ciało')![0];
  const start = new Date(`${corpusKey}T12:00:00`);
  const days = Array.from({ length: 4 }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    return date;
  });

  return <div className="year-strategy-guide">
    <div className="strategy-guide-intro">
      <p className="leave-eyebrow">JAK CZYTAĆ PROPOZYCJE?</p>
      <h3>Mniej dni urlopu.<br />Więcej wypoczynku.</h3>
      <p>Każda propozycja poniżej to <strong>jeden ciągły wypoczynek</strong>. „Dni urlopu” bierzesz ze swojej puli. „Dni wypoczynku” to cały wyjazd — razem ze świętami i weekendami.</p>
      <ol>
        <li><span>1</span>Ustaw termin i liczbę dni urlopu.</li>
        <li><span>2</span>Porównaj długość wypoczynku.</li>
        <li><span>3</span>Rozwiń plan, aby zobaczyć dni do wniosku.</li>
      </ol>
    </div>
    <div className="strategy-guide-example">
      <div className="strategy-example-heading"><span>PRZYKŁAD Z KALENDARZA</span><strong>Boże Ciało {year}</strong></div>
      <p className="strategy-example-range">{displayRange(days[0], days[3])}</p>
      <div className="strategy-equation" aria-label="1 dzień urlopu plus 3 dni świąt i weekendu to 4 dni wypoczynku">
        <div className="strategy-equation-leave"><strong>1</strong><span>dzień urlopu</span></div>
        <span className="strategy-equation-sign" aria-hidden="true">+</span>
        <div className="strategy-equation-free"><strong>3</strong><span>dni już wolne</span></div>
        <span className="strategy-equation-sign" aria-hidden="true">=</span>
        <div className="strategy-equation-total"><strong>4</strong><span>dni wypoczynku</span></div>
      </div>
      <div className="strategy-example-days">
        {days.map((date, index) => <div key={formatDateKey(date)} className={index === 1 ? 'strategy-example-leave-day' : ''}>
          <time dateTime={formatDateKey(date)}>{date.toLocaleDateString('pl-PL', { weekday: 'short' })} <strong>{date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'numeric' })}</strong></time>
          <span>{index === 0 ? 'Boże Ciało' : index === 1 ? 'Bierzesz urlop' : 'Weekend'}</span>
        </div>)}
      </div>
      <p className="strategy-example-note"><strong>Przykład: 4×</strong> — 4 dni wypoczynku za każdy 1 dzień urlopu. Zakładamy wolne soboty i niedziele.</p>
    </div>
  </div>;
}
