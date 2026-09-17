import React, { useMemo, useState } from 'react';
import { displayRange } from '../utils/vacationSuggestions';
import { BridgeDays, getBridgeExampleDays } from './BridgeDays';

export function StrategyGuide({ year }: { year: number }) {
  const [connected, setConnected] = useState(true);
  const days = useMemo(() => getBridgeExampleDays(year), [year]);

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
      <div className="strategy-equation" aria-live="polite" aria-atomic="true">
        <div className="strategy-equation-leave"><strong>{connected ? '1' : '0'}</strong><span>{connected ? 'dzień urlopu' : 'dni urlopu'}</span></div>
        <span className="strategy-equation-sign" aria-hidden="true">+</span>
        <div className="strategy-equation-free"><strong>{connected ? '3' : '2'}</strong><span>{connected ? 'dni już wolne' : 'dni weekendu'}</span></div>
        <span className="strategy-equation-sign" aria-hidden="true">=</span>
        <div className="strategy-equation-total"><strong>{connected ? '4' : '2'}</strong><span>dni wolnego ciągiem</span></div>
      </div>
      <BridgeDays days={days} connected={connected} onToggle={() => setConnected(value => !value)} variant="guide" />
      <p className="strategy-example-note">{connected ? <><strong>Tak działa mostek.</strong> Urlop w piątek łączy święto z weekendem: 4 dni wolnego za 1 dzień urlopu. Kliknij piątek, aby zobaczyć różnicę.</> : <><strong>Bez mostka: 2 dni wolnego ciągiem.</strong> Czwartek jest wolny, ale piątek w pracy oddziela go od weekendu. Kliknij piątek, aby połączyć dni.</>}<span>Zakładamy wolne soboty i niedziele.</span></p>
    </div>
  </div>;
}
