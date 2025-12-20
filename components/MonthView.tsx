import React from 'react';
import { MonthData } from '../types';
import { DayCell } from './DayCell';

interface MonthViewProps {
  month: MonthData;
}

const WEEKDAYS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

export const MonthView: React.FC<MonthViewProps> = ({ month }) => {
  return (
    <div className="flex flex-col p-2 rounded-xl">
      <h3 className="text-sm font-bold text-neutral-800 mb-2 text-center capitalize tracking-tight">{month.name}</h3>
      
      {/* Weekday Headers - Swiss Style Minimalist */}
      <div className="grid grid-cols-7 mb-2 border-b border-neutral-200/60 pb-1">
        {WEEKDAYS.map((day, i) => (
          <div key={day} className={`text-[10px] font-medium text-center lowercase tracking-tight ${i >= 6 ? 'text-rose-400' : 'text-neutral-300'}`}>
            {day.toLowerCase()}
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
