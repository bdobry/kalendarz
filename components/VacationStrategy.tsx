
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { analyzeVacationStrategies } from '../utils/vacationStrategyUtils';

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

// --- Helpers ---
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // 0 = Mon, 6 = Sun
};

const MiniCalendar: React.FC<{ 
    year: number; 
    month: number; 
    highlightStart: Date; 
    highlightEnd: Date; 
    vacationDays: Date[];
    showLabel?: boolean;
}> = ({ year, month, highlightStart, highlightEnd, vacationDays, showLabel = true }) => {
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const slots = Array(startDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)));

    const isDateInRange = (d: Date) => {
        const t = d.getTime();
        return t >= highlightStart.getTime() && t <= highlightEnd.getTime();
    };

    const isVacationDay = (d: Date) => {
        return vacationDays.some(vd => vd.toDateString() === d.toDateString());
    };

    const monthName = new Date(year, month, 1).toLocaleDateString('pl-PL', { month: 'long' });

    return (
        <div className="w-full h-full flex flex-col">
            {showLabel && (
                <div className="text-slate-400 font-bold text-center capitalize text-[10px] mb-1">
                    {monthName}
                </div>
            )}
            <div className="grid grid-cols-7 gap-0 text-center mb-1">
                {['P','W','Ś','C','P','S','N'].map(d => (
                    <div key={d} className="text-[8px] text-slate-300 font-bold">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5 flex-grow content-start">
                {slots.map((date, idx) => {
                    if (!date) return <div key={idx} className="aspect-square"></div>;
                    
                    const inRange = isDateInRange(date);
                    const isVacation = isVacationDay(date);
                    
                    let bg = "bg-transparent";
                    let text = "text-slate-400/80";
                    let font = "font-medium";
                    let extra = "";

                    if (inRange) {
                        if (isVacation) {
                            // AMBER for Vacation/Bridge (Days to take)
                            bg = "bg-amber-100 rounded-sm";
                            text = "text-amber-700";
                            font = "font-extrabold text-amber-600";
                        } else {
                            // INDIGO for Free Days (Long Weekend)
                            bg = "bg-indigo-100 rounded-sm";
                            text = "text-indigo-700";
                        }
                    } else {
                         const day = date.getDay();
                         if (day === 0 || day === 6) {
                             text = "text-red-300/60 font-normal"; 
                         }
                    }
                    
                    return (
                        <div key={idx} className={`aspect-square flex items-center justify-center text-[9px] ${bg} ${text} ${font} ${extra}`}>
                            {date.getDate()}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export const VacationStrategy: React.FC<VacationStrategyProps> = ({ year }) => {
  const strategies = useMemo(() => analyzeVacationStrategies(year), [year]);

  // Filters State
  const [minFreeDays, setMinFreeDays] = useState<number>(0);
  const [maxCost, setMaxCost] = useState<number>(26); // Default max assumed logic: show all up to max allowance
  // Month Selection: number (specific index) or number[] (ranges) or -1 (all)
  // To keep it simple, we can store selectedMonths as number[] | null. Null = All.
  const [selectedMonths, setSelectedMonths] = useState<number[] | null>(null);
  
  // UI State for custom dropdowns
  const [activeFilterDropdown, setActiveFilterDropdown] = useState<string | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
              setActiveFilterDropdown(null);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStrategies = useMemo(() => {
    let filtered = strategies.filter(s => {
        if (s.freeDays < minFreeDays) return false;
        if (s.daysToTake > maxCost) return false;
        
        if (selectedMonths !== null) {
            // Check if strategy starts in one of the selected months
            if (!selectedMonths.includes(s.monthIndex)) return false;
        }

        return s.efficiency > 1.8 || s.freeDays >= 5;
    });
    return filtered.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [strategies, minFreeDays, maxCost, selectedMonths]);

  const formatDateRange = (start: Date, end: Date) => {
      const startDay = start.getDate();
      const endDay = end.getDate();
      if (start.getMonth() === end.getMonth()) {
          return `${startDay} — ${endDay}`;
      }
      return `${startDay}.${(start.getMonth()+1).toString().padStart(2,'0')} — ${endDay}.${(end.getMonth()+1).toString().padStart(2,'0')}`;
  };

  const getMonthName = (date: Date) => date.toLocaleDateString('pl-PL', { month: 'long' });
  
  const getEfficiencyColor = (eff: number) => {
      if (eff >= 3.0) return "bg-emerald-100 text-emerald-800 border-emerald-200";
      if (eff >= 2.0) return "bg-indigo-100 text-indigo-800 border-indigo-200";
      return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const months = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];

  // Advanced Month Filters
  const monthPresets = [
      { label: 'Wiosna', months: [2, 3, 4, 5] },
      { label: 'Lato', months: [5, 6, 7, 8] },
      { label: 'Jesień', months: [8, 9, 10] },
      { label: 'Zima', months: [11, 0, 1] },
      { label: 'Wakacje', months: [6, 7] },
  ];

  const handlePresetClick = (presetMonths: number[]) => {
      setSelectedMonths(presetMonths);
      setActiveFilterDropdown(null);
  };
  
  const handleSingleMonthClick = (index: number) => {
      setSelectedMonths([index]);
      setActiveFilterDropdown(null);
  };

  const getMonthLabel = () => {
      if (selectedMonths === null) return 'Wszystkie';
      if (selectedMonths.length === 1) return months[selectedMonths[0]];
      // Check if matches preset
      for (const p of monthPresets) {
          if (p.months.length === selectedMonths.length && p.months.every((m, i) => selectedMonths.includes(m))) {
              return p.label;
          }
      }
      return 'Wybrane';
  };

  const FilterPill = ({ label, valueLabel, type, isActive }: { label: string, valueLabel: string, type: string, isActive: boolean }) => (
      <button 
        onClick={() => setActiveFilterDropdown(activeFilterDropdown === type ? null : type)}
        className={`
            relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
            ${isActive 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }
        `}
      >
          <span>{label}: <span className={isActive ? "text-indigo-100" : "text-slate-900 font-bold"}>{valueLabel}</span></span>
          <ChevronDown />
      </button>
  );

  const clearFilters = () => {
    setMinFreeDays(0);
    setMaxCost(26);
    setSelectedMonths(null);
    setActiveFilterDropdown(null);
  };

  const hasActiveFilters = minFreeDays > 0 || maxCost < 26 || selectedMonths !== null;

  if (strategies.length === 0) return null;

  return (
    <section className="mt-16 mb-12">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-10">
        <div className="flex items-start gap-4">
          <div className="h-10 w-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-200"></div>
          <div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">Strategia Urlopowa {year}</h2>
             <p className="text-slate-500 text-sm mt-1">Algorytm optymalizacji czasu wolnego • {filteredStrategies.length} okazji</p>
          </div>
        </div>

        {/* Filters */}
        <div className="relative" ref={filterRef}>
            <div className="flex flex-wrap items-center gap-3">
                
                {/* Month Filter */}
                <div className="relative">
                    <FilterPill 
                        label="Miesiąc" 
                        valueLabel={getMonthLabel()} 
                        type="month" 
                        isActive={selectedMonths !== null}
                    />
                    {activeFilterDropdown === 'month' && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                             {/* Presets */}
                             <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-slate-100">
                                <button onClick={() => {setSelectedMonths(null); setActiveFilterDropdown(null)}} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 transition-colors">Wszystkie</button>
                                {monthPresets.map(preset => (
                                    <button 
                                        key={preset.label}
                                        onClick={() => handlePresetClick(preset.months)}
                                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-700 transition-colors"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                             </div>

                             {/* Months Grid */}
                             <div className="grid grid-cols-2 gap-1">
                                 {months.map((m, idx) => (
                                     <button 
                                        key={idx} 
                                        onClick={() => handleSingleMonthClick(idx)}
                                        className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedMonths?.length === 1 && selectedMonths[0] === idx ? 'bg-indigo-50 text-indigo-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}
                                     >
                                         {m}
                                     </button>
                                 ))}
                             </div>
                        </div>
                    )}
                </div>

                {/* Duration Filter (Slider) */}
                <div className="relative">
                    <FilterPill 
                        label="Długość" 
                        valueLabel={minFreeDays === 0 ? 'Dowolna' : `Min. ${minFreeDays} dni`} 
                        type="duration" 
                        isActive={minFreeDays > 0}
                    />
                    {activeFilterDropdown === 'duration' && (
                         <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                             <div className="flex justify-between items-center">
                                 <span className="text-sm font-bold text-slate-700">Minimalna długość</span>
                                 <span className="text-indigo-600 font-bold text-lg">{minFreeDays} dni</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="16" 
                                value={minFreeDays} 
                                onChange={(e) => setMinFreeDays(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                             />
                             <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                 <span>Dowolna</span>
                                 <span>16+ dni</span>
                             </div>
                        </div>
                    )}
                </div>

                {/* Cost/VacationDays Filter (Slider) */}
                <div className="relative">
                    <FilterPill 
                        label="Ilość urlopu" 
                        valueLabel={maxCost === 26 ? 'Dowolna' : `Max ${maxCost} dni`} 
                        type="cost" 
                        isActive={maxCost < 26}
                    />
                    {activeFilterDropdown === 'cost' && (
                         <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                             <div className="flex justify-between items-center">
                                 <span className="text-sm font-bold text-slate-700">Max dni urlopowych</span>
                                 <span className="text-indigo-600 font-bold text-lg">{maxCost}</span>
                             </div>
                             <input 
                                type="range" 
                                min="1" 
                                max="26" 
                                value={maxCost} 
                                onChange={(e) => setMaxCost(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                             />
                             <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                                 <span>1 dzień</span>
                                 <span>26 dni (Max)</span>
                             </div>
                        </div>
                    )}
                </div>

                {hasActiveFilters && (
                    <button onClick={clearFilters} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <XIcon />
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredStrategies.map((strategy) => {
          const badgeClass = getEfficiencyColor(strategy.efficiency);
          
          const startMonth = strategy.startDate.getMonth();
          const endMonth = strategy.endDate.getMonth();
          const showTwoMonths = startMonth !== endMonth;
          
          const dominantMonthName = getMonthName(strategy.startDate);

          return (
            <div key={strategy.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-indigo-100/50 z-0 hover:z-10 h-64">
              
              <div className="p-5 h-full flex flex-col relative z-0">
                  {/* Clean Header */}
                  <div className="mb-2 flex justify-between items-start">
                      <div>
                          <div className="text-sm font-extrabold text-indigo-600 uppercase tracking-wider mb-1">
                              {dominantMonthName}
                          </div>
                          <div className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                              {formatDateRange(strategy.startDate, strategy.endDate)}
                          </div>
                      </div>
                      
                      {strategy.efficiency >= 3.0 && (
                          <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm border border-emerald-100">
                              🔥
                          </div>
                      )}
                  </div>
                  
                  <div className="h-px bg-slate-100 w-full mb-4"></div>

                  {/* Absolute Numbers Exchange */}
                  <div className="flex-grow flex flex-col justify-center mb-2">
                    <div className="flex items-center justify-between bg-slate-50/50 rounded-2xl p-2 border border-slate-100 group-hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col items-center flex-1 p-2">
                             <span className="text-3xl font-black text-slate-900 leading-none">
                                 {strategy.freeDays}
                             </span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 text-center">
                                 Wolne
                             </span>
                        </div>

                        <div className="text-slate-300">
                            <svg className="w-5 h-5 rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </div>

                        <div className="flex flex-col items-center flex-1 p-2">
                             <span className={`text-2xl font-bold leading-none ${strategy.daysToTake <= 3 ? 'text-emerald-500' : 'text-indigo-600'}`}>
                                 {strategy.daysToTake}
                             </span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 text-center">
                                 Urlop
                             </span>
                        </div>
                    </div>
                  </div>

                 {/* Badge / Leverage */}
                 <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                     <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${badgeClass}`}>
                        Lewar {strategy.efficiency.toFixed(1)}x
                     </span>
                     
                     <span className="text-xs font-semibold text-slate-400">
                         +{strategy.freeDays - strategy.daysToTake} dni zysku
                     </span>
                 </div>
              </div>

              {/* Hover Calendar Overlay - Full Cover */}
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 flex flex-col">
                    {/* Header for Hover */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/90 flex justify-between items-center backdrop-blur-md z-10">
                         <span className="text-xs font-black text-slate-700 uppercase tracking-widest truncate max-w-[50%]">
                             {showTwoMonths ? `${getMonthName(strategy.startDate)} - ${getMonthName(strategy.endDate)}` : getMonthName(strategy.startDate)}
                         </span>
                         <div className="flex gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300"></div> <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Urlop</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-sm bg-indigo-100 border border-indigo-200"></div> <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Wolne</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-grow relative w-full h-full p-2">
                        {showTwoMonths ? (
                            /* Double Month View */
                            /* Double Month View */
                            <div className="w-full h-full flex items-center justify-center gap-1">
                                <div className="flex-1 flex flex-col items-center h-full max-w-[50%]">
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-3 flex-none">
                                        {getMonthName(strategy.startDate)}
                                    </span>
                                    <div className="flex-1 w-full flex items-center justify-center min-h-0">
                                        <MiniCalendar 
                                            year={year} 
                                            month={startMonth} 
                                            highlightStart={strategy.startDate}
                                            highlightEnd={strategy.endDate}
                                            vacationDays={strategy.vacationDays}
                                            showLabel={false} 
                                        />
                                    </div>
                                </div>

                                <div className="w-px h-2/3 bg-slate-100 flex-none self-center"></div>

                                <div className="flex-1 flex flex-col items-center h-full max-w-[50%]">
                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-3 flex-none">
                                        {getMonthName(strategy.endDate)}
                                    </span>
                                     <div className="flex-1 w-full flex items-center justify-center min-h-0">
                                        <MiniCalendar 
                                            year={strategy.endDate.getFullYear()} 
                                            month={endMonth} 
                                            highlightStart={strategy.startDate}
                                            highlightEnd={strategy.endDate}
                                            vacationDays={strategy.vacationDays}
                                            showLabel={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Single Month View - Maximized */
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="h-full w-auto aspect-square max-w-full">
                                     <MiniCalendar 
                                        year={year} 
                                        month={startMonth} 
                                        highlightStart={strategy.startDate}
                                        highlightEnd={strategy.endDate}
                                        vacationDays={strategy.vacationDays}
                                        showLabel={false}
                                     />
                                </div>
                            </div>
                        )}
                    </div>
              </div>

            </div>
          );
        })}
      </div>

      {filteredStrategies.length === 0 && (
          <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                  <FilterIcon />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Brak wyników wyszukiwania</h3>
              <p className="text-slate-500 text-sm mb-4">Spróbuj zmienić parametry filtrów, aby znaleźć okazje urlopowe.</p>
              <button 
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl text-indigo-600 font-bold text-sm hover:shadow-md hover:border-indigo-100 transition-all"
              >
                  <XIcon />
                  Wyczyść filtry
              </button>
          </div>
      )}

      {/* SEO Content */}
       <div className="mt-12 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">Planer Urlopowy {year}</h3>
          <p className="text-slate-600 text-base leading-relaxed max-w-4xl">
              Sprawdź najlepsze terminy na urlop w tym roku. Powyższe zestawienie pokazuje, kiedy najlepiej wziąć wolne, aby zyskać jak najdłuższy nieprzerwany wypoczynek przy minimalnym zużyciu dni urlopowych.
              Korzystając z inteligentnych filtrów powyżej, możesz dostosować strategię do swoich potrzeb - wybierając konkretny miesiąc lub preferowaną długość wypoczynku.
          </p>
      </div>
    </section>
  );
};
