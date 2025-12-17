import React, { useMemo, useState } from 'react';
import { analyzeVacationStrategies } from '../utils/vacationStrategyUtils';
import { generateCalendarData } from '../utils/dateUtils';
import { MonthView } from './MonthView';
import { DayType, MonthData } from '../types';

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
        <div className="flex h-10 md:h-12 w-full rounded-lg border border-slate-200 shadow-sm bg-white">
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
                     // Holiday: Same BG as weekend (slate-50), but RED text
                     bgClass = "bg-slate-50"; 
                     textClass = "text-rose-500 font-black";
                } else if (isWeekend) {
                     // Weekend: Slate BG, Slate text
                     bgClass = "bg-slate-50";
                     textClass = "text-slate-500 font-bold"; 
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
                            border-r border-slate-100 last:border-0 
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
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover/tile:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 font-medium shadow-xl">
                            {dayNameFull}
                            {isHoliday && <span className="block text-rose-300 text-[10px] mt-0.5">Dzień ustawowo wolny</span>}
                             <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
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
}> = ({ strategy, baseCalendarData }) => {
    // 1. Determine relevant months
    const startMonthIndex = strategy.startDate.getMonth();
    const endMonthIndex = strategy.endDate.getMonth();
    
    // We want to show a mini calendar for the involved months.
    // Usually 1, max 2 months. 
    // Optimization: Only clone relevant months.
    
    const relevantMonths = useMemo(() => {
        // Handle year wrap-around scenario if needed (e.g. Dec -> Jan)
        // If startMonth > endMonth (e.g. 11 -> 0), it handles naturally because we look by index in baseData
        // BUT baseData might be just one year.
        // If strategy spans years, we might be missing Jan of next year if baseData is only current year.
        // However, standard month view usually only shows current year months.
        // If it spans years, we might need a robust way. But for now assuming within year or robust baseData.
        
        let monthIndices = [startMonthIndex];
        if (startMonthIndex !== endMonthIndex) {
            monthIndices.push(endMonthIndex);
        }
        
        // Handle Dec->Jan case (indices 11, 0)
        // If endMonth is 0 and start is 11, we need to be careful if our baseData has that.
        // baseData is standard 0..11.
        // If we need "Jan Next Year", we might not have it.
        // But let's assume standard use case first.
        
        return monthIndices.map(mIdx => {
             const originalMonth = baseCalendarData.find(m => m.monthIndex === mIdx);
             if (!originalMonth) return null;

             // Deep clone weeks/days to avoid mutating the global cache
             // (Though baseCalendarData should be stable, we are changing visual flags)
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
                             day.dayType = DayType.BRIDGE; // Reuse Bridge styling (Amber wavy)
                             day.isBridgeSequence = true;
                         } else {
                             // It's a free day (Weekend or Holiday)
                             // Keep original DayType but ensure it's marked as sequence
                             // Logic in DayCell handles coloring based on isLongWeekendSequence
                             // If it was WORKDAY but NOT in vacationDays, it shouldn't happen (logic error), 
                             // but if it does, it implicitly becomes "Free" visually via Indigo.
                         }
                         
                         // Fix borders for visual continuity
                         // We can mock the sequenceInfo to ensure connect-ability
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
                         // 0=Sun, 1=Mon
                         if (dow === 0 && dayTime < endTime) day.connectsToNextWeek = true;
                         if (dow === 1 && dayTime > startTime) day.connectsToPrevWeek = true;
                     } else {
                         // Reset flags for days outside strategy (important if we reused data that had other flags)
                         // But we cloned from fresh baseData which might have its own flags.
                         // Ideally we want to grey out or deprioritize other sequences?
                         // "Focus Mode".
                         // Maybe we explicitly set isLongWeekendSequence = false if it's NOT our strategy?
                         if (day.isLongWeekendSequence) {
                             // This is some OTHER sequence.
                             // Keep it or hide it?
                             // Design decision: Hide distraction?
                             // Let's hide other sequences to focus on THIS one.
                             day.isLongWeekendSequence = false;
                             day.isBridgeSequence = false;
                         }
                     }
                 });
             });
             
             return {
                 ...originalMonth,
                 weeks: newWeeks
             };
        }).filter(Boolean) as MonthData[];

    }, [baseCalendarData, strategy, startMonthIndex, endMonthIndex]);

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

    return (
        <div className="bg-slate-50 border-t border-slate-100 p-6 rounded-b-xl animate-fade-in-down cursor-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col xl:flex-row gap-8">
                
                {/* Detailed Stats (Now First/Left) */}
                <div className="xl:w-80 flex-shrink-0 order-2 xl:order-1">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Szczegóły Urlopu</h4>
                     
                     <div className="space-y-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-slate-600">Zyskujesz</span>
                                <span className="text-emerald-600 font-bold text-sm">+{strategy.freeDays - strategy.daysToTake} dni</span>
                            </div>
                             <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                                 {/* Visual ratio bar */}
                                 <div className="h-full bg-amber-400" style={{ width: `${(strategy.daysToTake / strategy.freeDays) * 100}%` }}></div>
                                 <div className="h-full bg-emerald-400" style={{ width: `${((strategy.freeDays - strategy.daysToTake) / strategy.freeDays) * 100}%` }}></div>
                             </div>
                             <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium uppercase">
                                 <span>Koszt ({strategy.daysToTake})</span>
                                 <span>Zysk ({strategy.freeDays - strategy.daysToTake})</span>
                             </div>
                        </div>

                        {holidaysInRange.length > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Dni Świąteczne w tym okresie</span>
                                <ul className="space-y-1">
                                    {holidaysInRange.map(h => (
                                        <li key={h} className="text-sm text-indigo-900 font-medium flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0"></span>
                                            {h}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                             <p className="text-xs text-indigo-800 leading-relaxed">
                                 <strong className="block text-indigo-900 mb-1">Dlaczego warto?</strong>
                                 Ten termin ma efektywność <strong className="text-indigo-700">{strategy.efficiency.toFixed(2)}x</strong>. 
                                 Oznacza to, że każdy dzień urlopu daje Ci ponad {Math.floor(strategy.efficiency)} dni wolnego!
                             </p>
                        </div>
                     </div>
                </div>

                {/* Visual Calendar (Now Second/Right) - Tooltips Disabled via pointer-events-none */}
                <div className="flex-1 order-1 xl:order-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Podgląd Kalendarza</h4>
                    <div className="flex flex-col md:flex-row gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 pointer-events-none select-none">
                        {relevantMonths.map(m => (
                            <div key={m.monthIndex} className="min-w-[280px] max-w-[320px] flex-1 scale-95 origin-top-left md:scale-100 md:origin-top">
                                <MonthView month={m} />
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};


export const VacationStrategy: React.FC<VacationStrategyProps> = ({ year }) => {
  const strategies = useMemo(() => analyzeVacationStrategies(year), [year]);
  const baseCalendarData = useMemo(() => generateCalendarData(year), [year]);

  // Filters State
  const [minFreeDays, setMinFreeDays] = useState<number>(0);
  const [maxCost, setMaxCost] = useState<number>(26);
  const [selectedMonths, setSelectedMonths] = useState<number[] | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'efficiency'>('date');
  
  // Expanded State
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
      setExpandedId(prev => prev === id ? null : id);
  };

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
      const startDay = start.getDate();
      const endDay = end.getDate();
      
      const startMonthShort = start.toLocaleDateString('pl-PL', { month: 'short' });
      const endMonthShort = end.toLocaleDateString('pl-PL', { month: 'short' });
      
      if (start.getMonth() === end.getMonth()) {
          return (
              <span className="text-sm md:text-base">
                  <span className="font-black text-slate-800 text-lg md:text-xl">{startDay}</span>
                   {' - '} 
                  <span className="font-black text-slate-800 text-lg md:text-xl">{endDay}</span>
                  <span className="text-slate-500 ml-1.5 text-sm uppercase font-black tracking-wide">{startMonthShort}</span>
              </span>
          );
      }
      return (
            <span className="text-sm md:text-base">
                <span className="font-black text-slate-800 text-lg md:text-xl">{startDay} <span className="text-slate-500 text-xs uppercase font-bold ml-0.5">{startMonthShort}</span></span>
                 {' - '} 
                <span className="font-black text-slate-800 text-lg md:text-xl">{endDay} <span className="text-slate-500 text-xs uppercase font-bold ml-0.5">{endMonthShort}</span></span>
            </span>
      );
  };

  const getEfficiencyColor = (eff: number) => {
      if (eff >= 3.0) return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20";
      if (eff >= 2.0) return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20";
      return "bg-slate-50 text-slate-600 ring-1 ring-slate-600/20";
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
          <div className="h-10 w-1.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-200/50 flex-shrink-0"></div>
          <div>
             <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Strategia Urlopowa {year}</h2>
             <p className="text-slate-500 font-medium text-sm mt-1">
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
      <div className="mb-6 sticky top-20 z-40 bg-slate-50/95 backdrop-blur-sm py-4 border-b border-slate-200/50">
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
      <div className="flex flex-col gap-4 md:gap-3">
        {filteredStrategies.map((strategy) => {
            const efficiencyBadgle = getEfficiencyColor(strategy.efficiency);
            const duration = Math.round((strategy.endDate.getTime() - strategy.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const isExpanded = expandedId === strategy.id;
            
            return (
                <div 
                    key={strategy.id} 
                    className={`group/card bg-white rounded-xl border transition-all duration-300 overflow-visible ${isExpanded ? 'border-indigo-300 shadow-md ring-1 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'}`}
                >
                    <div 
                        className="p-4 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 cursor-pointer"
                        onClick={() => toggleExpand(strategy.id)}
                    >
                        
                        {/* 1. Date Info (Mobile: Top Row) */}
                        <div className="flex justify-between items-center md:block flex-none md:min-w-[150px]">
                            <div className="mb-0 md:mb-2 text-slate-900">
                                {formatDateRange(strategy.startDate, strategy.endDate)}
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
                             <div className={`hidden md:flex ml-auto text-slate-300 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : ''}`}>
                                 <ChevronDown />
                             </div>
                        </div>

                    </div>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                        <StrategyExpandedDetails strategy={strategy} year={year} baseCalendarData={baseCalendarData} />
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
              <h3 className="text-base font-bold text-slate-700 mb-1">Brak wyników</h3>
              <button onClick={clearFilters} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Wyczyść filtry
              </button>
          </div>
      )}
    </section>
  );
};
