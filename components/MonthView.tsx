import React from 'react';
import { MonthData } from '../types';
import { DayCell } from './DayCell';

interface MonthViewProps {
  month: MonthData;
}

const WEEKDAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

export const MonthView: React.FC<MonthViewProps> = ({ month }) => {
  return (
    <div className="bg-canvas-default rounded-xl shadow-xs border border-neutral-200/60 p-4 pb-6 flex flex-col hover:shadow-md hover:border-brand-200/50 transition-all duration-300 group">
      <h3 className="text-lg font-bold text-neutral-800 mb-4 text-center capitalize tracking-tight">{month.name}</h3>
      
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div key={day} className={`text-[10px] font-bold text-center uppercase tracking-widest py-1 ${i >= 6 ? 'text-rose-500' : 'text-neutral-400'}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid - Note: gap-x-0 is crucial for the continuous sequence look */}
      <div className="flex-1 flex flex-col gap-y-1">
        {month.weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-x-0">
            {week.map((day, dayIdx) => (
              <DayCell key={`${weekIdx}-${dayIdx}`} day={day} currentMonthIndex={month.monthIndex} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
