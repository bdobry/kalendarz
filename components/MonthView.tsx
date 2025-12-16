import React from 'react';
import { MonthData } from '../types';
import { DayCell } from './DayCell';

interface MonthViewProps {
  month: MonthData;
}

const WEEKDAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];

export const MonthView: React.FC<MonthViewProps> = ({ month }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 pb-6 flex flex-col hover:shadow-md transition-shadow duration-300">
      <h3 className="text-lg font-bold text-slate-800 mb-4 text-center capitalize">{month.name}</h3>
      
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((day, i) => (
          <div key={day} className={`text-xs font-semibold text-center uppercase tracking-wider py-1 ${i >= 5 ? 'text-rose-400' : 'text-slate-400'}`}>
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
