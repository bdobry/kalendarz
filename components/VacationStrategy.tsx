import React, { useMemo, useState, useRef, useEffect } from 'react';
import { analyzeVacationStrategies, analyzeStrategyStats } from '../utils/vacationStrategyUtils';
import { trackEvent, AnalyticsCategory, AnalyticsAction } from '../utils/analytics';
import { generateGoogleCalendarLink, downloadIcsFile } from '../utils/calendarExportUtils';
import { generateCalendarData, getFormattedDateRange } from '../utils/dateUtils';
import { MonthView } from './MonthView';
import { DayType, MonthData } from '../types';
import statsData from '../data/vacationStats.json';

interface VacationStrategyProps {
  year: number;
}

// --- Icons ---
const ChevronDown = () => (
    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);
const XIcon = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);
const FilterIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);
const CalendarPlusIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4m0 0v4m0-4h4m-4 0H8" />
    </svg>
);

// --- Styles ---
const WAVY_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4' viewBox='0 0 6 4'%3E%3Cpath d='M0 2 Q1.5 0.5 3 2 T6 2' fill='none' stroke='%23f59e0b' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`;

// --- Components ---

const TimelineBar: React.FC<{
    strategy: any;
}> = ({ strategy }) => {
    const { startDate, endDate, vacationDays } = strategy;
    
    const daysArray = useMemo(() => {
        const arr = [];
        const curr = new Date(startDate);
        while (curr <= endDate) {
            arr.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return arr;
    }, [startDate, endDate]);
    
    const isVacation = (d: Date) => vacationDays.some((vd: Date) => vd.toDateString() === d.toDateString());
    
    // Helper to get day initial
    const getDayInitial = (date: Date) => {
        const day = date.getDay();
        const days = ['N', 'P', 'W', 'Ś', 'C', 'P', 'S'];
        return days[day];
    };

    return (
        <div className="flex h-10 md:h-12 w-full rounded-lg border border-neutral-200/60 shadow-xs bg-canvas-default">
            {daysArray.map((date, idx) => {
                const isVac = isVacation(date);
                const dayOfWeek = date.getDay();
                // 0=Sun, 6=Sat
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                // Logic check: if it's NOT vacation cost, and NOT weekend, it's a Holiday in this context 
                // (since this strategy finder only groups free blocks).
                const isHoliday = !isVac && !isWeekend; 
                
                let bgClass = "bg-white"; 
                let textClass = "text-slate-300";
                
                if (isVac) {
                    bgClass = "bg-amber-100/80 relative"; // Amber for "Cost" days
                    textClass = "text-amber-800 font-bold";
                } else if (isHoliday) {
                     // Holiday: Same BG as weekend (neutral-50), but RED text
                     bgClass = "bg-neutral-50"; 
                     textClass = "text-rose-500 font-black";
                } else if (isWeekend) {
                     // Weekend: Neutral BG, Neutral text
                     bgClass = "bg-neutral-50";
                     textClass = "text-neutral-500 font-bold";  
                } else {
                     bgClass = "bg-white"; 
                     textClass = "text-slate-300";
                }

                const dayNameFull = date.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
                const dayInitial = getDayInitial(date);

                // Rounding logic for first/last
                const roundedClass = idx === 0 ? 'rounded-l-lg' : idx === daysArray.length - 1 ? 'rounded-r-lg' : '';

                return (
                    <div 
                        key={idx} 
                        className={`
                            flex-1 ${bgClass} ${textClass} ${roundedClass}
                            flex flex-col items-center justify-center 
                            border-r border-neutral-100 last:border-0 
                            relative group/tile min-w-[18px]
                        `}
                    >
                         {/* Wavy line for vacation days */}
                         {isVac && (
                           <>
                             <div 
                               className="absolute -top-[1px] left-0 right-0 h-[4px] w-full z-10 opacity-70"
                               style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }}
                             />
                             <div 
                               className="absolute -bottom-[1px] left-0 right-0 h-[4px] w-full z-10 opacity-70"
                               style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }}
                             />
                           </>
                         )}

                        {/* Day Initial */}
                        <span className="text-[10px] md:text-xs z-10 select-none">{dayInitial}</span>
                        {/* Day Number */}
                         <span className="text-[9px] opacity-60 leading-none mt-0.5">{date.getDate()}</span>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-800 text-white text-xs rounded-lg opacity-0 group-hover/tile:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-medium shadow-xl">
                            {dayNameFull}
                            {isHoliday && <span className="block text-rose-300 text-[10px] mt-0.5">Dzień ustawowo wolny</span>}
                             <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-800"></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- Expanded View Component ---
const StrategyExpandedDetails: React.FC<{
    strategy: any;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    year: number;
    baseCalendarData: MonthData[];
}> = ({ strategy, year, baseCalendarData }) => {
    // 1. Determine relevant months
    const startMonthIndex = strategy.startDate.getMonth();
    const endMonthIndex = strategy.endDate.getMonth();
    
    // Stats Calculation
    const statsInfo = useMemo(() => analyzeStrategyStats(strategy, statsData), [strategy]);
    
    // We want to show a mini calendar for the involved months.
    // Usually 1, max 2 months. 
    // Optimization: Only clone relevant months.
    
    const relevantMonths = useMemo(() => {
        // If strategy spans years (e.g. Dec 2029 -> Jan 2030), we need 2029 Dec and 2030 Jan.
        const startYear = strategy.startDate.getFullYear();
        const endYear = strategy.endDate.getFullYear();
        
        const monthsNeeded: { monthIndex: number, year: number }[] = [];
        
        monthsNeeded.push({ monthIndex: startMonthIndex, year: startYear });
        
        // If it's a different month OR different year, we need the second part
        if (startMonthIndex !== endMonthIndex || startYear !== endYear) {
             monthsNeeded.push({ monthIndex: endMonthIndex, year: endYear });
        }
        
        return monthsNeeded.map(req => {
            let originalMonth: MonthData | undefined;

             // Try to find in base data if years match
             if (req.year === year) {
                 originalMonth = baseCalendarData.find(m => m.monthIndex === req.monthIndex);
             } else {
                 // Generate fresh data for that year
                 const otherYearData = generateCalendarData(req.year);
                 originalMonth = otherYearData.find(m => m.monthIndex === req.monthIndex);
             }

             if (!originalMonth) return null;

             // Deep clone weeks/days to avoid mutating the global cache
             const newWeeks = originalMonth.weeks.map(week => week.map(day => ({...day})));
             
             // Apply Strategy Overlays
             newWeeks.forEach(week => {
                 week.forEach(day => {
                     // Check if this day is part of the strategy range
                     const dayTime = day.date.getTime();
                     const startTime = strategy.startDate.getTime();
                     const endTime = strategy.endDate.getTime();
                     
                     if (dayTime >= startTime && dayTime <= endTime) {
                         day.isLongWeekendSequence = true;
                         
                         // Check if it's a "Cost" day (Vacation Day)
                         const isCostDay = strategy.vacationDays.some((vd: Date) => vd.toDateString() === day.date.toDateString());
                         
                         if (isCostDay) {
                             day.dayType = DayType.BRIDGE; 
                             day.isBridgeSequence = true;
                         }
                         
                         // Fix borders for visual continuity
                         day.sequenceInfo = {
                             id: strategy.id,
                             start: strategy.startDate,
                             end: strategy.endDate,
                             length: strategy.freeDays
                         };
                         
                         // Recalculate start/end flags for this specific view (since global flags might be different)
                         day.isSequenceStart = (dayTime === startTime);
                         day.isSequenceEnd = (dayTime === endTime);
                         
                         // Recalculate Prev/Next week connections for local view
                         const dow = day.date.getDay(); 
                         if (dow === 0 && dayTime < endTime) day.connectsToNextWeek = true;
                         if (dow === 1 && dayTime > startTime) day.connectsToPrevWeek = true;
                     } else {
                         // Focus Mode: Hide other sequences
                         if (day.isLongWeekendSequence) {
                             day.isLongWeekendSequence = false;
                             day.isBridgeSequence = false;
                         }
                     }
                 });
             });
             
             // Append Year to Month Name for clarity
             return {
                 ...originalMonth,
                 name: `${originalMonth.name} ${req.year}`, 
                 weeks: newWeeks
             };
        }).filter(Boolean) as MonthData[];

    }, [baseCalendarData, strategy, startMonthIndex, endMonthIndex, year]);

    // Gather extra facts
    const holidaysInRange = useMemo(() => {
        const hols: string[] = [];
        const seen = new Set();
        // Scan standard calendar or use date utils? 
        // We can just iterate the relevantMonths we just built, seeing as they contain original day info too.
        relevantMonths.forEach(m => m.weeks.forEach(w => w.forEach(d => {
            if (d.dayType === DayType.HOLIDAY && d.holidayName && d.date >= strategy.startDate && d.date <= strategy.endDate) {
                if (!seen.has(d.holidayName)) {
                    hols.push(d.holidayName);
                    seen.add(d.holidayName);
                }
            }
        })));
        return hols;
    }, [relevantMonths, strategy]);

    // Calendar Export Handler
    const [showCalendarMenu, setShowCalendarMenu] = useState(false);

    const handleCalendarAction = (type: 'google' | 'ics') => {
        const eventTitle = `Urlop: ${statsInfo?.periodName || 'Wypoczynek'}`;
        const eventDetails = `Zaplanowano z nierobie.pl\nEfektywność: ${strategy.efficiency.toFixed(2)}x\nZyskujesz: ${strategy.freeDays} dni wolnego za ${strategy.daysToTake} dni urlopu.`;
        
        const eventData = {
            title: eventTitle + " - Brzmi jak plan! 🏖️",
            startDate: strategy.startDate,
            endDate: strategy.endDate,
            details: eventDetails,
            location: 'Laba'
        };

        if (type === 'google') {
            const link = generateGoogleCalendarLink(eventData);
            window.open(link, '_blank');
        } else {
            downloadIcsFile(eventData, `urlop_${strategy.startDate.toISOString().slice(0,10)}.ics`);
        }
        setShowCalendarMenu(false);
    };

    return (
        <div className="bg-canvas-subtle border-t border-neutral-200/60 p-6 animate-fade-in-down cursor-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col xl:flex-row gap-8">
                
                {/* Detailed Stats (Left Side) */}
                <div className="xl:w-80 flex-shrink-0 order-2 xl:order-1">
                     <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Analiza Terminu</h4>
                     
                     <div className="space-y-4">

                        {/* 1. Statistics Block (New Priority) */}
                        {statsInfo && (
                             <div className="bg-gradient-to-br from-brand-50 to-white p-4 rounded-xl border border-brand-100 relative overflow-hidden group/stats">
                                 {/* Accents */}
                                 <div className="absolute top-0 right-0 w-24 h-24 bg-brand-100/40 rounded-bl-full -mr-8 -mt-8 pointer-events-none"></div>

                                 {/* Header */}
                                 <div className="relative z-10 mb-3">
                                     <p className="text-[10px] text-brand-400 font-bold uppercase tracking-widest mb-2 opacity-80">
                                        Termin: {statsInfo.periodName}
                                     </p>
                                     
                                     <div className="flex items-start gap-3">
                                         <div className="text-2xl mt-0.5 filter drop-shadow-sm">
                                            {statsInfo.rating === 'BEST' ? '🏆' : 
                                             statsInfo.rating === 'RARE' ? '🔥' : 
                                             statsInfo.rating === 'VERY_GOOD' ? '✨' : 
                                             statsInfo.rating === 'GOOD' ? '👍' : '📅'}
                                         </div>
                                         <div>
                                            <div className="flex flex-col gap-1">
                                                {statsInfo.rating === 'BEST' && (
                                                    <div className="text-sm font-bold text-brand-900 leading-tight">
                                                        Najlepszy możliwy układ
                                                    </div>
                                                )}
                                                {statsInfo.rating === 'RARE' && (
                                                    <div className="text-sm font-bold text-amber-600 leading-tight">
                                                        Rzadka Okazja
                                                    </div>
                                                )}
                                                {statsInfo.rating === 'VERY_GOOD' && (
                                                    <div className="text-sm font-bold text-brand-900 leading-tight">
                                                        Bardzo dobry termin
                                                    </div>
                                                )}
                                                {statsInfo.rating === 'GOOD' && (
                                                    <div className="text-sm font-bold text-brand-900 leading-tight">
                                                        {statsInfo.isStandardSequence ? 'Standardowy układ' : 'Dobry termin'}
                                                    </div>
                                                )}
                                                {statsInfo.rating === 'AVERAGE' && (
                                                    <div className="text-sm font-bold text-slate-600 leading-tight">
                                                        Przeciętny termin
                                                    </div>
                                                )}
                                            </div>
                                            
                                             {/* Better than logic */}
                                             {!statsInfo.isStandardSequence && !statsInfo.isBestPossible && statsInfo.rating !== 'AVERAGE' && statsInfo.percentile > 0 && (
                                                <div className="text-xs text-indigo-600 font-medium">
                                                    Lepsze niż <strong className="text-indigo-800">{statsInfo.percentile}%</strong> innych okazji w tym okresie.
                                                </div>
                                             )}
                                             
                                             {!statsInfo.isStandardSequence && statsInfo.isBestPossible && (
                                                 <div className="text-xs text-indigo-600 font-medium">
                                                     Maksymalna efektywność dla tego okresu.
                                                 </div>
                                             )}
                                             {statsInfo.isStandardSequence && (
                                                 <div className="text-xs text-indigo-600 font-medium">
                                                     Cykliczna okazja każdego roku.
                                                 </div>
                                             )}
                                             
                                             {/* Hide "Better than" for Average/Standard to avoid "Better than 17%" sadness, unless user wants stats. 
                                                 But user specifically complained about "Very good term" + "17%".
                                                 Now it will be "Standard term" and we can optionally show percentile if we want, or hide it.
                                                 Decided to hide percentile for AVERAGE rating to reduce noise, unless it's explicitly decent (e.g. > 20%?) 
                                                 But AVERAGE is < 40%.
                                                 Let's just show it if it's > 0, people like stats. But "Standard term" + "Better than 17%" is strictly consistent logic.
                                                 "Very good" + "17%" was the contradiction.
                                                 I'll uncomment the percentile show for AVERAGE if needed, but for now I limited it to !AVERAGE above.
                                                 Actually, let's show it for AVERAGE too, because context is useful?
                                                 "Standardowy termin. Lepsze niż 17% innych okazji." - This makes sense. It explains WHY it is standard/average.
                                             */}
                                             {!statsInfo.isStandardSequence && !statsInfo.isBestPossible && statsInfo.rating === 'AVERAGE' && (
                                                 <div className="text-xs text-slate-500 font-medium">
                                                     Lepsze niż <strong className="text-slate-700">{statsInfo.percentile}%</strong> innych okazji w tym okresie.
                                                 </div>
                                             )}

                                         </div>
                                     </div>
                                 </div>

                                 {/* Data Grid */}
                                 <div className="relative z-10 bg-white/60 rounded-lg p-3 backdrop-blur-sm border border-indigo-50 shadow-sm space-y-2.5">
                                     {statsInfo.frequencyText && (
                                         <div className="flex justify-between items-baseline text-xs">
                                             <span className="text-slate-500">Częstotliwość:</span>
                                             <span className="text-indigo-900 font-bold text-right">{statsInfo.frequencyText}</span>
                                         </div>
                                     )}
                                     {statsInfo.nextOccurrence && (
                                         <div className="flex justify-between items-baseline text-xs">
                                              <span className="text-slate-500">Kolejna taka okazja:</span>
                                              <span className="text-indigo-900 font-bold text-right">{statsInfo.nextOccurrence}</span>
                                         </div>
                                     )}
                                     <div className="h-px bg-indigo-100/80 my-2"></div>
                                     <div className="flex justify-between items-baseline text-xs pt-0.5">
                                            <span className="text-slate-500">Mnożnik urlopu:</span>
                                            <span className="text-emerald-600 font-black text-right">{strategy.efficiency.toFixed(2)}x</span>
                                     </div>
                                 </div>
                            </div>
                        )}

                        {/* 2. Cost/Gain Block */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Bilans Dni</span>
                                <div className="text-xs font-medium text-slate-500">
                                    Zyskujesz <span className="text-emerald-600 font-bold">+{strategy.freeDays - strategy.daysToTake} dni</span>
                                </div>
                            </div>
                             
                             {/* Bars */}
                             <div className="w-full bg-slate-100 rounded-lg h-2.5 overflow-hidden flex mb-2">
                                 <div 
                                     className="h-full bg-amber-400 relative group/bar" 
                                     style={{ width: `${(strategy.daysToTake / strategy.freeDays) * 100}%` }}
                                 >
                                     <div className="absolute inset-0 bg-white/20"></div>
                                     <div className="absolute top-0 right-0 h-full w-px bg-white/40"></div>
                                 </div>
                                 <div className="h-full bg-emerald-400 flex-1"></div>
                             </div>

                             <div className="flex justify-between text-[11px] font-medium leading-none">
                                 <div className="flex items-center gap-1.5 text-amber-700">
                                     <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                     Koszt: {strategy.daysToTake}
                                 </div>
                                 <div className="flex items-center gap-1.5 text-emerald-700">
                                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                                      Wolne: {strategy.freeDays}
                                 </div>
                             </div>
                        </div>

                        {/* 3. Holidays List */}
                        {holidaysInRange.length > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3 block">Święta w terminie</span>
                                <ul className="space-y-2.5">
                                    {holidaysInRange.map(h => (
                                        <li key={h} className="text-xs text-slate-700 font-medium flex items-start gap-2.5 group/holiday">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 mt-1.5 group-hover/holiday:scale-125 transition-transform"></div>
                                            <span className="leading-snug group-hover/holiday:text-slate-900 transition-colors">{h}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                     </div>
                </div>

                {/* Visual Calendar (Now Second/Right) - Tooltips Enabled */}
                <div className="flex-1 order-1 xl:order-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Podgląd Kalendarza</h4>
                    
                    <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 select-none">
                        {relevantMonths.map(m => (
                            <div key={m.monthIndex} className="min-w-[280px] max-w-[320px] flex-1 scale-95 origin-top-left md:scale-100 md:origin-top">
                                <MonthView 
                                    month={m} 
                                    hoveredSequenceId={null} 
                                    onHoverSequence={() => {}} 
                                    hideGhostDays={true} 
                                />
                            </div>
                        ))}
                    </div>

                    {/* Add to Calendar Button (Below) */}
                    <div className="mt-4 flex justify-start">
                         <div className="relative">
                             <button 
                                 onClick={() => setShowCalendarMenu(!showCalendarMenu)}
                                 className="flex items-center gap-2 text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-2 rounded-lg transition-colors border border-brand-100"
                             >
                                 <CalendarPlusIcon />
                                 <span>Dodaj do kalendarza</span>
                             </button>
                             
                             {showCalendarMenu && (
                                 <>
                                     <div className="fixed inset-0 z-10" onClick={() => setShowCalendarMenu(false)}></div>
                                     <div className="absolute right-0 bottom-full mb-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 animate-fade-in-up origin-bottom-right">
                                         <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 rounded-t-xl">
                                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Eksportuj Termin</span>
                                         </div>
                                         <button 
                                             onClick={() => handleCalendarAction('google')}
                                             className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                                         >
                                             <span className="text-base">📅</span>
                                             <span>Kalendarz Google</span>
                                         </button>
                                         <button 
                                             onClick={() => handleCalendarAction('ics')}
                                             className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                                         >
                                              <span className="text-base">📥</span>
                                             <span>Plik .ics (Outlook, Apple)</span>
                                         </button>
                                         <div className="border-t border-slate-100 my-1"></div>
                                         <div className="px-4 py-1.5 text-[10px] text-slate-400 font-medium text-center">
                                             Wspierane przez nierobie.pl
                                         </div>
                                     </div>
                                 </>
                             )}
                         </div>
                    </div>
                </div>

            </div>
        </div>
    );
};


export const VacationStrategy: React.FC<VacationStrategyProps> = ({ year }) => {
  const strategies = useMemo(() => analyzeVacationStrategies(year), [year]);
  const baseCalendarData = useMemo(() => generateCalendarData(year), [year]);
  const listRef = useRef<HTMLDivElement>(null);

  // Filters State
  const [minFreeDays, setMinFreeDays] = useState<number>(0);
  const [maxCost, setMaxCost] = useState<number>(26);
  const [selectedMonths, setSelectedMonths] = useState<number[] | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'efficiency'>('date');
  
  // Expanded State
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
      const isOpening = expandedId !== id;
      setExpandedId(prev => prev === id ? null : id);

      if (isOpening) {
        // Track expansion
        trackEvent({
            category: AnalyticsCategory.STRATEGY,
            action: AnalyticsAction.EXPAND,
            label: id
        });

        // Wait for render/animation frame then scroll
        setTimeout(() => {
            const el = document.getElementById(`strategy-card-${id}`);
            if (el) {
                // Calculate offset: Header (~60px) + Sticky Filter Bar (~80px) + Buffer
                // sticky top is 76px. Header is roughly 60-70px.
                // Total sticky area is roughly 140-150px.
                const offset = 160; 
                const elementPosition = el.getBoundingClientRect().top + window.scrollY;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        }, 100);
      }
  };

  // Scroll to top of list when filters change (presets only to avoid slider jank)
  useEffect(() => {
      if (listRef.current && (selectedMonths !== null || sortBy)) {
          // Check if we are physically below the start of the list
          const listTop = listRef.current.getBoundingClientRect().top + window.scrollY;
          const stickyOffset = 150; // Approximated header + filter bar
          
          if (window.scrollY > listTop - stickyOffset) {
             window.scrollTo({
                 top: listTop - stickyOffset,
                 behavior: 'smooth' 
             });
          }
      }
  }, [selectedMonths, sortBy]);

  const filteredStrategies = useMemo(() => {
    let filtered = strategies.filter(s => {
        if (s.freeDays < minFreeDays) return false;
        if (s.daysToTake > maxCost) return false;
        
        if (selectedMonths !== null) {
            if (!selectedMonths.includes(s.monthIndex)) return false;
        }

        return s.efficiency > 1.8 || s.freeDays >= 5;
    });
    
    return filtered.sort((a, b) => {
        if (sortBy === 'efficiency') {
            return b.efficiency - a.efficiency;
        }
        return a.startDate.getTime() - b.startDate.getTime();
    });
  }, [strategies, minFreeDays, maxCost, selectedMonths, sortBy]);

  const formatDateRange = (start: Date, end: Date) => {
      const { startDay, endDay, startMonthShort, endMonthShort, startYear, endYear, isSameMonth, isSameYear } = getFormattedDateRange(start, end);

      // Case 1: Same Month, Same Year
      if (isSameMonth) {
          return (
              <span className="text-sm md:text-base">
                  <span className="font-black text-slate-800 text-lg md:text-xl">{startDay}</span>
                   {' - '} 
                  <span className="font-black text-slate-800 text-lg md:text-xl">{endDay}</span>
                  <span className="text-slate-500 ml-1.5 text-sm uppercase font-black tracking-wide">{startMonthShort}</span>
              </span>
          );
      }
      
      // Case 2: Different Month, Same Year
      if (isSameYear) {
        return (
            <span className="text-sm md:text-base">
                <span className="font-black text-slate-800 text-lg md:text-xl">{startDay} <span className="text-slate-500 text-xs uppercase font-bold ml-0.5">{startMonthShort}</span></span>
                 {' - '} 
                <span className="font-black text-slate-800 text-lg md:text-xl">{endDay} <span className="text-slate-500 text-xs uppercase font-bold ml-0.5">{endMonthShort}</span></span>
            </span>
        );
      }

      // Case 3: Different Year (Year Boundary) - Add Years
      return (
        <span className="text-sm md:text-base">
            <span className="font-black text-slate-800 text-lg md:text-xl">{startDay} <span className="text-slate-500 text-xs uppercase font-bold ml-0.5">{startMonthShort}</span></span>
             <span className="text-slate-400 text-[10px] font-bold ml-1">{startYear}</span>
             {' - '} 
            <span className="font-black text-slate-800 text-lg md:text-xl">{endDay} <span className="text-slate-500 text-xs uppercase font-bold ml-0.5">{endMonthShort}</span></span>
            <span className="text-slate-400 text-[10px] font-bold ml-1">{endYear}</span>
        </span>
      );
  };

  const getEfficiencyColor = (eff: number) => {
      if (eff >= 3.0) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
      if (eff >= 2.0) return "bg-brand-50 text-brand-700 ring-1 ring-brand-600/20";
      return "bg-neutral-50 text-neutral-600 ring-1 ring-neutral-600/20";
  };

  const monthPresets = [
      { label: 'Wakacje', months: [6, 7] },
      { label: 'Majówka', months: [4] },
      { label: 'Wiosna', months: [2, 3, 4, 5] },
      { label: 'Lato', months: [5, 6, 7, 8] },
      { label: 'Jesień', months: [8, 9, 10] },
      { label: 'Zima', months: [11, 0, 1] },
  ];

  const handlePresetClick = (presetMonths: number[]) => {
      setSelectedMonths(presetMonths);
  };

  const clearFilters = () => {
    setMinFreeDays(0);
    setMaxCost(26);
    setSelectedMonths(null);
  };

  const hasActiveFilters = minFreeDays > 0 || maxCost < 26 || selectedMonths !== null;

  if (strategies.length === 0) return null;

  return (
    <section className="mt-12 mb-12 w-full mx-auto">
      {/* Header & Legend */}
      <div className="mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-10 w-1.5 bg-brand-600 rounded-full shadow-lg shadow-brand-200/50 flex-shrink-0"></div>
          <div>
             <h2 className="text-xl md:text-2xl font-black text-neutral-900 tracking-tight">Strategia urlopowa {year}</h2>
             <p className="text-neutral-500 font-medium text-sm mt-1">
                 Wybierz najlepszy termin na urlop.
             </p>
          </div>
        </div>
        
        {/* SEO / Legend Text */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Analiza Kalendarza</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Algorytm skanuje cały rok, łącząc weekendy i dni ustawowo wolne. Dzięki temu widzisz, kiedy najlepiej wziąć wolne, by zyskać najdłuższy ciągły wypoczynek.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                   <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Optymalizacja Kosztu</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">System liczy, ile dni urlopowych musisz zużyć. Czasem warto dołożyć 1 dzień więcej z puli urlopowej, by zyskać cały dodatkowy tydzień wolnego.</p>
                </div>
                <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Efektywność</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">Algorytm wylicza efektywność każdego ciągu urlopowego. Wynik 3.0x oznacza, że za 1 dzień urlopu dostajesz aż 3 dni wolnego. Im większy wynik, tym mniej dni urlopowych musisz zużyć.</p>
                </div>
            </div>
        </div>
      </div>

      {/* Modern Filters Toolbar - Transparent */}
      <div className="mb-6 sticky top-[76px] z-40 bg-canvas-subtle/95 backdrop-blur-sm py-4 border-b border-neutral-200/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            
            {/* 1. Quick Month Actions */}
            <div className="flex-1 w-full lg:w-auto">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Kiedy?</label>
                <div className="flex flex-wrap gap-2">
                    <button 
                         onClick={() => setSelectedMonths(null)}
                         className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedMonths === null ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                        Wszystkie
                    </button>
                    {monthPresets.map(preset => {
                        const isActive = selectedMonths !== null && 
                                         preset.months.length === selectedMonths.length && 
                                         preset.months.every(m => selectedMonths.includes(m));
                        
                        return (
                            <button 
                                key={preset.label}
                                onClick={() => handlePresetClick(preset.months)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${isActive ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Sliders & Sort */}
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4 w-full lg:w-auto">
                
                {/* Duration Slider */}
                <div className="flex-1 min-w-[140px] max-w-[200px]">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Min. Długość</label>
                        <div className="flex items-center gap-1">
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${minFreeDays > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{minFreeDays > 0 ? `${minFreeDays} dni` : 'Dowolna'}</span>
                             {minFreeDays > 0 && (
                                 <button onClick={() => setMinFreeDays(0)} className="text-slate-400 hover:text-red-500 transition-colors p-0.5">
                                     <XIcon />
                                 </button>
                             )}
                        </div>
                    </div>
                    <input 
                        type="range" 
                        min="0" 
                        max="16"
                        step="1" 
                        value={minFreeDays} 
                        onChange={(e) => setMinFreeDays(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
                    />
                </div>

                {/* Cost Slider */}
                <div className="flex-1 min-w-[140px] max-w-[200px]">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Koszt</label>
                         <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-colors ${maxCost < 26 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{maxCost === 26 ? 'Bez limitu' : `${maxCost} dni`}</span>
                            {maxCost < 26 && (
                                 <button onClick={() => setMaxCost(26)} className="text-slate-400 hover:text-red-500 transition-colors p-0.5">
                                     <XIcon />
                                 </button>
                             )}
                         </div>
                    </div>
                    <input 
                        type="range" 
                        min="1" 
                        max="26" 
                        step="1"
                        value={maxCost} 
                        onChange={(e) => setMaxCost(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500"
                    />
                </div>

                {/* Sort Controls - Integrated inline */}
                <div className="flex flex-col justify-end">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 text-right lg:text-left block">Sortuj</label>
                    <div className="flex bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                        <button 
                            onClick={() => setSortBy('date')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${sortBy === 'date' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Data
                        </button>
                        <button 
                            onClick={() => setSortBy('efficiency')}
                            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${sortBy === 'efficiency' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Efektywność
                        </button>
                    </div>
                </div>

            </div>
        </div>
      </div>

      {/* List Content */}
      <div className="flex flex-col gap-4 md:gap-3" ref={listRef}>
        {filteredStrategies.map((strategy) => {
            const efficiencyBadgle = getEfficiencyColor(strategy.efficiency);
            const duration = Math.round((strategy.endDate.getTime() - strategy.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const isExpanded = expandedId === strategy.id;
            
            return (
                <div 
                    key={strategy.id} 
                    id={`strategy-card-${strategy.id}`}
                    onClick={() => toggleExpand(strategy.id)}
                    className={`group/card bg-canvas-default rounded-xl border transition-all duration-300 overflow-visible relative hover:z-30 ${isExpanded ? 'border-brand-300 shadow-md ring-1 ring-brand-200 z-20' : 'border-neutral-200/60 hover:border-brand-300/60 hover:shadow-md'}`}
                >
                    <div 
                        className="p-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 cursor-pointer"
                    >
                        
                        {/* 1. Date Info (Mobile: Top Row) */}
                        <div className="flex justify-between items-center md:block flex-none md:min-w-[150px]">
                            <div className="mb-0 md:mb-2 text-slate-900 group">
                                {formatDateRange(strategy.startDate, strategy.endDate)}
                                
                                {/* Indicator for Main Bar */}
                                {(() => {
                                     const info = analyzeStrategyStats(strategy, statsData);
                                     if (info && info.stats) {
                                         return (
                                            <div className="flex flex-col gap-1 mt-1 md:flex-row md:flex-wrap md:w-fit">
                                                {!info.isStandardSequence && info.isBestPossible && (
                                                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-100 text-[10px] text-emerald-700 font-bold">
                                                        <span>🏆</span> <span className="hidden md:inline">Najlepszy możliwy układ</span>
                                                    </div>
                                                )}
                                                
                                                {info.isRare && (
                                                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-100 text-[10px] text-amber-700 font-bold">
                                                        <span>🔥</span> <span className="hidden md:inline">Rzadka Okazja</span>
                                                    </div>
                                                )}
                                                
                                                {info.isStandardSequence && (
                                                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[10px] text-slate-500 font-bold">
                                                        <span>📅</span> <span className="hidden md:inline">Cykliczny układ</span>
                                                    </div>
                                                )}
                                            </div>
                                         );
                                     }
                                     return null;
                                })()}
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${efficiencyBadgle}`}>
                                {strategy.efficiency.toFixed(1)}x
                            </span>
                        </div>

                        {/* 2. Visual Timeline (Mobile: Middle Row) */}
                        <div className="flex-grow min-w-0 md:min-w-[200px] order-3 md:order-2">
                             <TimelineBar strategy={strategy} />
                        </div>

                        {/* 3. Highlighted Stats (Mobile: Bottom Row, Compact) */}
                        <div className="flex-none flex items-center justify-between md:justify-start gap-4 md:border-l md:border-slate-100 md:pl-6 md:ml-0 order-2 md:order-3 my-1 md:my-0">
                            {/* Days Off */}
                            <div className="flex flex-row md:flex-col items-baseline md:items-center gap-2 md:gap-0 min-w-[50px]">
                                <span className="text-xl md:text-3xl font-black text-slate-900 leading-none">{duration}</span>
                                <span className="text-[10px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wide">Wolne</span>
                            </div>

                            {/* Cost */}
                            <div className="flex flex-row md:flex-col items-baseline md:items-center gap-2 md:gap-0 min-w-[50px]">
                                <span className={`text-xl md:text-3xl font-black leading-none ${strategy.daysToTake <= 3 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {strategy.daysToTake}
                                </span>
                                <span className="text-[10px] md:text-[9px] font-bold text-slate-400 uppercase tracking-wide">Koszt</span>
                            </div>
                            
                            {/* Expand Chevron Icon */}

                        </div>

                    </div>

                    {/* Micro-interaction: Hover Drop Indicator */}
                    {/* Permanent Expand Bar */}
                    {!isExpanded && (
                        <div 
                            onClick={(e) => { e.stopPropagation(); toggleExpand(strategy.id); }}
                            className="w-full border-t border-neutral-100 bg-slate-50/50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest py-2.5 flex items-center justify-center gap-1.5 rounded-b-xl cursor-pointer transition-colors group/footer"
                        >
                            <span>Rozwiń szczegóły</span>
                            <div className="group-hover/footer:translate-y-0.5 transition-transform duration-300">
                                <ChevronDown />
                            </div>
                        </div>
                    )}
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                        <>
                            <StrategyExpandedDetails strategy={strategy} year={year} baseCalendarData={baseCalendarData} />
                            
                            {/* Collapse Bar */}
                            <div 
                                onClick={(e) => { e.stopPropagation(); toggleExpand(strategy.id); }}
                                className="w-full border-t border-neutral-200/60 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-1.5 rounded-b-xl cursor-pointer transition-colors group/footer"
                            >
                                <span>Zwiń</span>
                                <div className="group-hover/footer:-translate-y-0.5 transition-transform duration-300 rotate-180">
                                    <ChevronDown />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            );
        })}
      </div>

      {filteredStrategies.length === 0 && (
          <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="mx-auto w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-slate-400">
                  <FilterIcon />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-2">Brak wyników dla tych kryteriów</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-4 leading-relaxed">
                  Tutaj znajdziesz tylko bardzo opłacalne strategie — <b>gdzie 1 dzień urlopu daje przynajmniej 2 dni wolnego ciągiem</b>, 
                  dla których potrzebujesz min. 2 dni urlopu.
                  <br/>
                  Spróbuj poluzować filtry, aby zobaczyć więcej opcji.
              </p>
              <button onClick={clearFilters} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg transition-colors">
                  Wyczyść filtry
              </button>
          </div>
      )}
    </section>
  );
};
