import React from 'react';
import { VacationOpportunity } from '../utils/vacationStrategyUtils';

interface StrategyDescriptionProps {
  strategy: VacationOpportunity;
  rating?: string; // 'BEST' | 'GOOD' | 'AVG' | 'BAD'
}

// Logic extracted for testing
export const generateStrategyText = (strategy: VacationOpportunity, rating?: string): string => {
  const { startDate, endDate, daysToTake, freeDays, efficiency } = strategy;
  const year = startDate.getFullYear();

  const formatDate = (date: Date) => date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
  const startStr = formatDate(startDate);
  const endStr = formatDate(endDate);

  // Holiday Detection Logic
  // const isMonth = (date: Date, month: number) => date.getMonth() === month; // 0-indexed needs explicit usage or cleanup
  // const isDay = (date: Date, day: number) => date.getDate() === day;

  let holidayName = '';
  // Majówka (May 1-3)
  // Check if strategy overlaps with May 1-3
  const startMonth = startDate.getMonth();
  
  // Majówka detection: starts late April or early May
  if ((startMonth === 3 && startDate.getDate() > 25) || (startMonth === 4 && startDate.getDate() < 10)) {
       holidayName = `Majówka ${year}`;
  }
  
  // Christmas (Dec 20-31)
  if (startMonth === 11 && startDate.getDate() > 19) {
    holidayName = `Boże Narodzenie ${year}`;
  }
  
  // Corpus Christi (June mostly) - rough heuristic
  if (!holidayName && startMonth === 5) {
      // Often mid-June
      if (startDate.getDate() > 10) holidayName = `Długi weekend czerwcowy ${year}`;
  }
  
  // August (Aug 15)
  if (!holidayName && startMonth === 7 && (startDate.getDate() > 10 && startDate.getDate() < 20)) {
       holidayName = `Wniebowzięcie NMP ${year}`;
  }
  
  // November
  if (!holidayName && startMonth === 10) {
      if (startDate.getDate() < 5) holidayName = `Wszystkich Świętych ${year}`;
      else if (startDate.getDate() > 5 && startDate.getDate() < 15) holidayName = `Listopad ${year}`;
  }

  // Base text construction
  if (rating === 'BEST') {
     return `Hit! ${holidayName || 'Genialny termin'}. Biorąc ${daysToTake} dni urlopu (${startStr} - ${endStr}), zyskujesz aż ${freeDays} dni wolnego. To idealny czas na dłuższy wyjazd.`;
  } 
  
  if (freeDays >= 9) {
     return `Super okazja na ${holidayName || 'długie wakacje'}. Tylko ${daysToTake} dni urlopu zamieniasz na ${freeDays}-dniowy wypoczynek (${startStr} - ${endStr}).`;
  } 
  
  if (efficiency >= 2.0) {
      return `Opłacalny termin ${holidayName ? `na ${holidayName}` : ''}. Zyskujesz ${freeDays} dni wolnego kosztem ${daysToTake} dni urlopu.`;
  } 
  
  return `Dobry moment na krótki urlop ${holidayName ? `(${holidayName})` : ''}. Odpocznij ${freeDays} dni, wykorzystując ${daysToTake} dni urlopu w terminie ${startStr} - ${endStr}.`;
};

export const StrategyDescription: React.FC<StrategyDescriptionProps> = ({ strategy, rating }) => {
  const text = generateStrategyText(strategy, rating);

  return (
    <p className="text-[11px] text-slate-500 leading-snug">
      {text}
    </p>
  );
};
