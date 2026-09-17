import { LEAVE_WAVE } from '../utils/calendarVisuals';
import { LeaveWave } from './LeaveWave';
import React, { useMemo, useContext } from 'react';
import { TodayContext } from './TodayProvider';
import { DayInfo, DayType } from '../types';
import { getDayStyles } from '../utils/dayStyleUtils';
import { getHolidayStats } from '../utils/vacationStrategyUtils';

interface DayCellProps {
  day: DayInfo;
  currentMonthIndex?: number;
  hoveredSequenceId?: string | null;
  onHoverSequence?: (id: string | null) => void;
  hideGhostDays?: boolean;
  interaction?: React.ButtonHTMLAttributes<HTMLButtonElement> & { 'data-date': string };
  children?: React.ReactNode;
  hideWave?: boolean;
  shapedWave?: boolean;
}


export const DayCell: React.FC<DayCellProps> = ({ day, currentMonthIndex, hoveredSequenceId, onHoverSequence, hideGhostDays, interaction, children, hideWave, shapedWave = false }) => {
  const today = useContext(TodayContext);
  if (!day || !day.date) {
    return <div className="h-8 w-full" aria-hidden="true" />;
  }

  // Generate unique ID for scrolling
  const cellId = `day-${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;

  const isActiveSequence = day.isLongWeekendSequence && day.sequenceInfo?.id === hoveredSequenceId;
  const styles = getDayStyles(day, currentMonthIndex || 0, isActiveSequence, hideGhostDays, today);

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
  const showWave = styles.wavyLines && day.isLongWeekendSequence && !hideWave;
  const waveClass = showWave && shapedWave ? 'shaped-bridge' : '';
  const renderDay = (content: React.ReactNode) => interaction
    ? <button {...interaction} className={`calendar-day ${styles.innerContainerClasses} ${interaction.className ?? ''} ${waveClass}`}>{content}</button>
    : <div className={`calendar-day ${styles.innerContainerClasses} ${waveClass}`}>{content}</div>;

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
      {renderDay(<>
        {/* Wavy Borders for Bridges */}
        {showWave && (shapedWave ? <LeaveWave /> : (
           <>
             <div 
               className="absolute -top-[1px] left-0 right-0 h-[4px] w-full z-20"
               style={{ backgroundImage: LEAVE_WAVE, backgroundRepeat: 'repeat-x' }}
             />
             <div 
               className="absolute -bottom-[1px] left-0 right-0 h-[4px] w-full z-20"
               style={{ backgroundImage: LEAVE_WAVE, backgroundRepeat: 'repeat-x' }}
             />
           </>
        ))}

        {/* Inner Content */}
        {children ?? <span className="relative z-10">{day.date.getDate()}</span>}
      </>)}

      {/* Tooltip Overlay */}
      {!interaction && (showCustomTooltip || simpleTooltipText) && (
        <div className="calendar-tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover/day:block z-50 whitespace-normal min-w-[200px]">
           {showCustomTooltip && holidayStats ? (
               <div className="bg-white text-neutral-700 text-xs rounded-lg shadow-xl border border-brand-100 p-2.5 relative overflow-hidden ring-1 ring-black/5 min-w-[200px]">
                   
                   {/* Header: Group Name */}
                   <div className="font-bold text-neutral-900 text-sm leading-tight">
                       {holidayStats.holidayGroupName || day.holidayName || day.linkedHolidayName}
                   </div>

                    {/* Bridge Day Suggestion */}
                    {day.dayType === DayType.BRIDGE && (
                        <div className="text-leisure-ink font-medium text-xs mt-1">
                            Weź urlop — długi weekend
                        </div>
                    )}

                   {/* Subheader: Specific Day Name */}
                   {day.holidayName && day.holidayName !== (holidayStats.holidayGroupName) && (
                        <div className="text-brand-600 font-semibold text-xs mt-0.5">
                            {day.holidayName}
                        </div>
                   )}
                   
                   <div className="mt-2 mb-2">
                       {holidayStats.isStandard ? (
                            <div className="text-[10px] text-neutral-500 italic">
                                {holidayStats.standardDescription || "To standardowa sytuacja co roku."}
                            </div>
                       ) : (
                           <>
                                {holidayStats.rating === 'OPTIMAL' ? (
                                    <div className="bg-leisure-lime text-leisure-ink text-[10px] font-medium p-1.5 rounded-md border border-leisure-ink/20 text-center">
                                        Najoptymalniejszy długi weekend!
                                    </div>
                                ) : holidayStats.rating === 'GOOD' ? (
                                    <div className="bg-leisure-lime text-leisure-ink text-[10px] font-medium p-1.5 rounded-md border border-leisure-ink/20 text-center">
                                        Korzystny układ (lepszy od {holidayStats.percentile}%)
                                    </div>
                                ) : holidayStats.rating === 'AVERAGE' ? (
                                    <div className="bg-leisure-peach text-leisure-copper text-[10px] font-medium p-1.5 rounded-md border border-leisure-copper/25 text-center">
                                       Układ lepszy niż {holidayStats.percentile}% innych
                                    </div>
                                ) : (
                                    <div className="bg-neutral-100 text-neutral-600 text-[10px] font-medium p-1.5 rounded-md border border-neutral-200 text-center">
                                       To najsłabszy możliwy układ.
                                    </div>
                                )}
                           </>
                       )}
                   </div>

                   {!holidayStats.isStandard && (
                       <div className="space-y-1">
                           <div className="text-[10px] text-neutral-500">
                               Częstotliwość: <span className="font-semibold text-neutral-700">{holidayStats.frequencyText}</span>
                           </div>

                           {holidayStats.nextOccurrenceYear && (
                               <div className="flex justify-between items-center text-[10px] text-neutral-500">
                                   <span>
                                       {holidayStats.isOptimal 
                                        ? "Kolejny taki układ:" 
                                        : "Najbliższy idealny układ:"
                                       }
                                   </span>
                                   <span className="bg-neutral-100 text-neutral-700 font-bold px-1.5 py-0.5 rounded border border-neutral-200 ml-1">
                                       {holidayStats.nextOccurrenceYear}
                                   </span>
                               </div>
                           )}
                       </div>
                   )}
                   
                   {day.isLongWeekendSequence && day.sequenceInfo && (
                        <div className="text-[9px] text-neutral-400 mt-2 pt-1.5 border-t border-neutral-100 text-center font-medium mx-auto w-fit px-2">
                            {day.sequenceInfo.start.toLocaleDateString('pl-PL', {day:'numeric', month:'numeric'})} - {day.sequenceInfo.end.toLocaleDateString('pl-PL', {day:'numeric', month:'numeric'})}
                        </div>
                   )}
                   
                   <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-6 border-transparent border-t-white drop-shadow-sm"></div>
               </div>
           ) : (
                <div className="bg-neutral-800 text-white text-[10px] py-1 px-2 rounded shadow-lg relative whitespace-nowrap">
                    {simpleTooltipText}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-neutral-800"></div>
                </div>
           )}
        </div>
      )}
    </div>
  );
};
