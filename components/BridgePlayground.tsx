import React, { useMemo, useRef, useState } from 'react';
import { formatDateKey, getPolishHolidays } from '../utils/dateUtils';

export function BridgePlayground({ year }: { year: number }) {
  const [connected, setConnected] = useState(false);
  const scene = useRef<HTMLDivElement>(null);
  const days = useMemo(() => {
    const corpus = [...getPolishHolidays(year)].find(([, name]) => name === 'Boże Ciało')![0];
    const start = new Date(`${corpus}T12:00:00`);
    return Array.from({ length: 4 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [year]);

  const tilt = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    scene.current?.style.setProperty('--tilt-x', `${(event.clientX - bounds.left) / bounds.width * 12 - 6}deg`);
    scene.current?.style.setProperty('--tilt-y', `${6 - (event.clientY - bounds.top) / bounds.height * 12}deg`);
  };
  const resetTilt = () => {
    scene.current?.style.removeProperty('--tilt-x');
    scene.current?.style.removeProperty('--tilt-y');
  };

  return <div className="bridge-playground" onPointerMove={tilt} onPointerLeave={resetTilt}>
    <div className="bridge-scene" ref={scene} data-connected={connected}>
      <div className="bridge-calendar">
        <div className="bridge-binding" aria-hidden="true"><i /><i /></div>
        <div className="bridge-calendar-heading"><span>MAŁY MOSTEK, DUŻO WOLNEGO</span><span>{year}</span></div>
        <div className="bridge-calendar-title"><strong>Boże Ciało</strong><span>{days[0].toLocaleDateString('pl-PL', { month: 'long' })}</span></div>
        <div className="bridge-days">
          {days.map((date, index) => {
            const contents = <><span>{['CZ', 'PT', 'SO', 'ND'][index]}</span><time dateTime={formatDateKey(date)}>{date.getDate().toString().padStart(2, '0')}</time><span>{index === 0 ? 'święto' : index === 1 ? (connected ? 'urlop ✓' : '+ urlop') : 'weekend'}</span></>;
            return index === 1
              ? <button key={index} type="button" className="bridge-day bridge-leave" aria-label="Dodaj dzień urlopu w piątek" aria-pressed={connected} onClick={() => setConnected(value => !value)}>{contents}</button>
              : <div key={index} className={`bridge-day ${index === 0 ? 'bridge-holiday' : 'bridge-weekend'}`}>{contents}</div>;
          })}
        </div>
        <div className="bridge-result" aria-live="polite" aria-atomic="true"><strong>{connected ? '4' : '2'}</strong><div><span>{connected ? 'dni wolnego ciągiem.' : 'dni weekendu.'}</span><small>{connected ? 'Tylko 1 dzień z puli urlopu.' : 'A gdyby tak przedłużyć weekend?'}</small></div><span className="bridge-result-icon" aria-hidden="true">{connected ? '☀' : '↗'}</span></div>
        <div className="bridge-calendar-footer"><span>nierobie.pl</span><span>{connected ? 'STATUS: NIE ROBIĘ' : 'PLAN NA WIĘCEJ NIC'}</span></div>
      </div>
      <span className="bridge-stamp" aria-hidden="true">{connected ? <>DOBRZE<br />BYĆ OFF.</> : <>ZRÓB SOBIE<br />MOSTEK.</>}</span>
    </div>
    <p className="bridge-hint"><span aria-hidden="true">↳</span> Kliknij piątek. Zobacz, ile zyskujesz.</p>
  </div>;
}
