import React from 'react';
import { DayInfo, DayType } from '../types';
import { getDayStyles } from '../utils/dayStyleUtils';

interface DayCellProps {
  day: DayInfo;
  currentMonthIndex?: number;
}

// SVG data for wavy line (amber-500)
const WAVY_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4' viewBox='0 0 6 4'%3E%3Cpath d='M0 2 Q1.5 0.5 3 2 T6 2' fill='none' stroke='%23f59e0b' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`;

export const DayCell: React.FC<DayCellProps> = ({ day, currentMonthIndex }) => {
  if (!day || !day.date) {
    return <div className="h-9 w-full" aria-hidden="true" />;
  }

  // Generate unique ID for scrolling
  const cellId = `day-${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;

  const styles = getDayStyles(day, currentMonthIndex || 0);

  if (!styles.showContent) {
    return <div className="h-9 w-full" aria-hidden="true" />;
  }

  return (
    <div id={cellId} className={styles.wrapper}>
      <div className={styles.innerContainerClasses}>
        {/* Wavy Borders for Bridges */}
        {styles.wavyLines && day.isLongWeekendSequence && (
           <>
             {/* Top Wavy Line - Shifted up by 1px to center the wave on the border line */}
             <div 
               className="absolute -top-[1px] left-0 right-0 h-[4px] w-full z-20"
               style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }}
             />
             {/* Bottom Wavy Line - Shifted down by 1px */}
             <div 
               className="absolute -bottom-[1px] left-0 right-0 h-[4px] w-full z-20"
               style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }}
             />
           </>
        )}

        {/* Inner Content */}
        <span className="relative z-10">{day.date.getDate()}</span>
        
        {/* Holiday Indicator */}
        {day.dayType === DayType.HOLIDAY && (
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 shadow-sm"></span>
        )}
      </div>

      {/* Custom Tooltip */}
      {styles.tooltipText && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-50 whitespace-nowrap">
          <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg relative">
            {styles.tooltipText}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      )}
    </div>
  );
};
