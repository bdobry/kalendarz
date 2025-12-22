import React, { useMemo } from 'react';
import { DayInfo, DayType } from '../types';
import { getDayStyles } from '../utils/dayStyleUtils';
import { getHolidayStats } from '../utils/vacationStrategyUtils';

interface DayCellProps {
  day: DayInfo;
  currentMonthIndex?: number;
  hoveredSequenceId?: string | null;
  onHoverSequence?: (id: string | null) => void;
}

// SVG data for wavy line (amber-500)
const WAVY_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4' viewBox='0 0 6 4'%3E%3Cpath d='M0 2 Q1.5 0.5 3 2 T6 2' fill='none' stroke='%23f59e0b' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`;

export const DayCell: React.FC<DayCellProps> = ({ day, currentMonthIndex, hoveredSequenceId, onHoverSequence }) => {
  if (!day || !day.date) {
    return <div className="h-8 w-full" aria-hidden="true" />;
  }

  // Generate unique ID for scrolling
  const cellId = `day-${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;

  const isActiveSequence = day.isLongWeekendSequence && day.sequenceInfo?.id === hoveredSequenceId;
  const styles = getDayStyles(day, currentMonthIndex || 0, isActiveSequence);

  // --- Holiday Stats Logic ---
  const holidayStats = useMemo(() => {
    if ((day.dayType === DayType.HOLIDAY && day.holidayName) || (day.isLongWeekendSequence && day.linkedHolidayName)) {
        const name = day.holidayName || day.linkedHolidayName;
        if (name) {
            // Use sequence end year to handle New Year spanning (Dec 2028 -> Jan 2029)
            const statsYear = day.sequenceInfo ? day.sequenceInfo.end.getFullYear() : day.date.getFullYear();
            return getHolidayStats(name, statsYear);
        }
    }
    return null;
  }, [day]);

  if (!styles.showContent) {
    return <div className="h-8 w-full" aria-hidden="true" />;
  }

  const showCustomTooltip = !!holidayStats;
  const simpleTooltipText = styles.tooltipText;

  return (
    <div 
      id={cellId} 
      className={`${styles.wrapper} group/day`}
      onMouseEnter={() => {
        if (day.isLongWeekendSequence && day.sequenceInfo && onHoverSequence) {
          onHoverSequence(day.sequenceInfo.id);
        }
      }}
      onMouseLeave={() => {
        if (onHoverSequence) {
          onHoverSequence(null);
        }
      }}
    >
      <div className={styles.innerContainerClasses}>
        {/* Wavy Borders for Bridges */}
        {styles.wavyLines && day.isLongWeekendSequence && (
           <>
             <div 
               className="absolute -top-[1px] left-0 right-0 h-[4px] w-full z-20"
               style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }}
             />
             <div 
               className="absolute -bottom-[1px] left-0 right-0 h-[4px] w-full z-20"
               style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }}
             />
           </>
        )}

        {/* Inner Content */}
        <span className="relative z-10">{day.date.getDate()}</span>
      </div>

      {/* Tooltip Overlay */}
      {(showCustomTooltip || simpleTooltipText) && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover/day:block z-50 whitespace-normal min-w-[200px]">
           {showCustomTooltip && holidayStats ? (
               <div className="bg-white text-slate-700 text-xs rounded-lg shadow-xl border border-indigo-100 p-2.5 relative overflow-hidden ring-1 ring-black/5 min-w-[200px]">
                   
                   {/* Header: Group Name */}
                   <div className="font-bold text-slate-900 text-sm leading-tight">
                       {holidayStats.holidayGroupName || day.holidayName || day.linkedHolidayName}
                   </div>

                   {/* Subheader: Specific Day Name */}
                   {day.holidayName && day.holidayName !== (holidayStats.holidayGroupName) && (
                        <div className="text-indigo-600 font-semibold text-xs mt-0.5">
                            {day.holidayName}
                        </div>
                   )}
                   
                   <div className="mt-2 mb-2">
                       {holidayStats.isStandard ? (
                            <div className="text-[10px] text-slate-500 italic">
                                {holidayStats.standardDescription || "To standardowa sytuacja co roku."}
                            </div>
                       ) : (
                           <>
                               {holidayStats.isOptimal ? (
                                   <div className="bg-emerald-50 text-emerald-700 text-[10px] font-medium p-1.5 rounded-md border border-emerald-100 text-center">
                                       Najbardziej optymalny długi weekend!
                                   </div>
                               ) : (
                                   <div className="bg-amber-50 text-amber-700 text-[10px] font-medium p-1.5 rounded-md border border-amber-100 text-center">
                                      {holidayStats.percentile > 0 
                                        ? `Układ lepszy niż ${holidayStats.percentile}% innych` 
                                        : "To najsłabszy możliwy układ."}
                                   </div>
                               )}
                           </>
                       )}
                   </div>

                   {!holidayStats.isStandard && (
                       <div className="space-y-1">
                           <div className="text-[10px] text-slate-500">
                               Częstotliwość: <span className="font-semibold text-slate-700">{holidayStats.frequencyText}</span>
                           </div>

                           {holidayStats.nextOccurrenceYear && (
                               <div className="flex justify-between items-center text-[10px] text-slate-500">
                                   <span>
                                       {holidayStats.isOptimal 
                                        ? "Kolejny taki układ:" 
                                        : "Najbliższy idealny układ:"
                                       }
                                   </span>
                                   <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200 ml-1">
                                       {holidayStats.nextOccurrenceYear}
                                   </span>
                               </div>
                           )}
                       </div>
                   )}
                   
                   {day.isLongWeekendSequence && day.sequenceInfo && (
                        <div className="text-[9px] text-slate-400 mt-2 pt-1.5 border-t border-slate-100 text-center font-medium mx-auto w-fit px-2">
                            {day.sequenceInfo.start.toLocaleDateString('pl-PL', {day:'numeric', month:'numeric'})} - {day.sequenceInfo.end.toLocaleDateString('pl-PL', {day:'numeric', month:'numeric'})}
                        </div>
                   )}
                   
                   <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-6 border-transparent border-t-white drop-shadow-sm"></div>
               </div>
           ) : (
                <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg relative whitespace-nowrap">
                    {simpleTooltipText}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
           )}
        </div>
      )}
    </div>
  );
};
