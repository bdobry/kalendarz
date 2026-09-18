import React from 'react';
import { formatDateKey, getPolishHolidays } from '../utils/dateUtils';
import { LeaveWave } from './LeaveWave';

export function getBridgeExampleDays(year: number) {
  const corpus = [...getPolishHolidays(year)].find(([, name]) => name === 'Boże Ciało')![0];
  const start = new Date(`${corpus}T12:00:00`);
  return Array.from({ length: 4 }, (_, offset) => {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    return date;
  });
}

export function BridgeDays({ days, connected, onToggle, variant = 'hero' }: {
  days: Date[];
  connected: boolean;
  onToggle: () => void;
  variant?: 'hero' | 'guide';
}) {
  return <div className={`bridge-days bridge-days-${variant}`} data-connected={connected}>
    {days.map((date, index) => {
      const contents = <>
        <span>{['CZ', 'PT', 'SO', 'ND'][index]}</span>
        <time dateTime={formatDateKey(date)}>{variant === 'hero' ? String(date.getDate()).padStart(2, '0') : `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`}</time>
        <span>{index === 0 ? (variant === 'hero' ? 'święto' : 'Boże Ciało') : index === 1 ? (connected ? 'urlop ✓' : '+ urlop') : 'weekend'}</span>
      </>;
      return index === 1
        ? <button key={formatDateKey(date)} type="button" className={`bridge-day bridge-leave${connected ? ' shaped-bridge' : ''}`} aria-label="Urlop w piątek" aria-pressed={connected} onClick={onToggle}>{contents}{connected && <LeaveWave animated />}</button>
        : <div key={formatDateKey(date)} className={`bridge-day ${index === 0 ? 'bridge-holiday' : 'bridge-weekend'}`}>{contents}</div>;
    })}
  </div>;
}
