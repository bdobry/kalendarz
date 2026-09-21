import { displayRange, validPlanDate } from '../utils/personalPlan';
import { strategyDateKeys } from '../utils/strategyPreview';
import './vacation-strategy.css';
import { formatDateKey } from '../utils/dateUtils';
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { analyzeVacationStrategies, analyzeStrategyStats } from '../utils/vacationStrategyUtils';
import { trackEvent, AnalyticsCategory, AnalyticsAction } from '../utils/analytics';
import { generateGoogleCalendarLink, downloadIcsFile } from '../utils/calendarExportUtils';
import { generateCalendarData } from '../utils/dateUtils';
import { MonthView } from './MonthView';
import { StrategyDescription } from './StrategyDescription';
import { StrategyGuide } from './StrategyGuide';
import { DayType, MonthData } from '../types';
import statsData from '../data/vacationStats.json';
import { getStrategyInsights } from '../utils/strategyInsights';
import { StrategyBadges } from './StrategyBadges';
import { StrategyTimeline } from './StrategyTimeline';

interface VacationStrategyProps {
  year: number;
  precalculatedStrategies?: ReturnType<typeof analyzeVacationStrategies>;
  ready: boolean;
  coveredDates: ReadonlySet<string>;
  onAdd: (dates: string[]) => void;
  onCalendar: (date?: string) => void;
}

// --- Icons ---
const CalendarPlusIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4m0 0v4m0-4h4m-4 0H8" />
    </svg>
);

// --- Styles ---

// --- Components ---

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
    const comparison = useMemo(() => getStrategyInsights(strategy), [strategy]);
    
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
            downloadIcsFile(eventData, `urlop_${formatDateKey(strategy.startDate)}.ics`);
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
                                                    <div className="text-sm font-bold text-leisure-copper leading-tight">
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
                                                    <div className="text-sm font-bold text-neutral-600 leading-tight">
                                                        Przeciętny termin
                                                    </div>
                                                )}
                                            </div>
                                            
                                             {/* Better than logic */}
                                             {!statsInfo.isStandardSequence && !statsInfo.isBestPossible && statsInfo.rating !== 'AVERAGE' && statsInfo.percentile > 0 && (
                                                <div className="text-xs text-brand-600 font-medium">
                                                    Lepszy niż <strong className="text-brand-800">{comparison?.betterThanPercent}%</strong> wariantów tego okresu w latach 2024–2100.
                                                </div>
                                             )}
                                             
                                             {!statsInfo.isStandardSequence && statsInfo.isBestPossible && (
                                                 <div className="text-xs text-brand-600 font-medium">
                                                     Maksymalna efektywność dla tego okresu.
                                                 </div>
                                             )}
                                             {statsInfo.isStandardSequence && (
                                                 <div className="text-xs text-brand-600 font-medium">
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
                                                 <div className="text-xs text-neutral-500 font-medium">
                                                     Lepszy niż <strong className="text-neutral-700">{comparison?.betterThanPercent}%</strong> wariantów tego okresu w latach 2024–2100.
                                                 </div>
                                             )}

                                         </div>
                                     </div>
                                 </div>

                                 {/* Data Grid */}
                                 <div className="relative z-10 bg-white/60 rounded-lg p-3 backdrop-blur-sm border border-brand-50 shadow-sm space-y-2.5">
                                     {statsInfo.frequencyText && (
                                         <div className="flex justify-between items-baseline text-xs">
                                             <span className="text-neutral-500">Częstotliwość:</span>
                                             <span className="text-brand-900 font-bold text-right">{statsInfo.frequencyText}</span>
                                         </div>
                                     )}
                                     {statsInfo.nextOccurrence && (
                                         <div className="flex justify-between items-baseline text-xs">
                                              <span className="text-neutral-500">Kolejna taka okazja:</span>
                                              <span className="text-brand-900 font-bold text-right">{statsInfo.nextOccurrence}</span>
                                         </div>
                                     )}
                                     <div className="h-px bg-brand-100/80 my-2"></div>
                                     <div className="flex justify-between items-baseline text-xs pt-0.5">
                                            <span className="text-neutral-500">Mnożnik urlopu:</span>
                                            <span className="text-leisure-ink font-black text-right">{strategy.efficiency.toFixed(2)}x</span>
                                     </div>
                                 </div>
                            </div>
                        )}

                        {/* 2. Cost/Gain Block */}
                        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Bilans Dni</span>
                                <div className="text-xs font-medium text-neutral-500">
                                    Zyskujesz <span className="text-leisure-ink font-bold">+{strategy.freeDays - strategy.daysToTake} dni</span>
                                </div>
                            </div>
                             
                             {/* Bars */}
                             <div className="w-full bg-neutral-100 rounded-lg h-2.5 overflow-hidden flex mb-2">
                                 <div 
                                     className="h-full bg-leisure-lime relative group/bar"
                                     style={{ width: `${(strategy.daysToTake / strategy.freeDays) * 100}%` }}
                                 >
                                     <div className="absolute inset-0 bg-white/20"></div>
                                     <div className="absolute top-0 right-0 h-full w-px bg-white/40"></div>
                                 </div>
                                 <div className="h-full bg-leisure-lilac flex-1"></div>
                             </div>

                             <div className="flex justify-between text-[11px] font-medium leading-none">
                                 <div className="flex items-center gap-1.5 text-leisure-ink">
                                     <div className="w-2 h-2 rounded-full bg-leisure-lime"></div>
                                     Urlop: {strategy.daysToTake}
                                 </div>
                                 <div className="flex items-center gap-1.5 text-leisure-ink">
                                      <div className="w-2 h-2 rounded-full bg-leisure-lilac border border-brand-200"></div>
                                      Święta i weekendy: {strategy.freeDays - strategy.daysToTake}
                                 </div>
                             </div>

                             {/* SEO Description Injection */}
                             <div className="mt-3 pt-3 border-t border-neutral-100">
                                <StrategyDescription strategy={strategy} rating={statsInfo?.rating} />
                             </div>
                        </div>

                        {/* 3. Holidays List */}
                        {holidaysInRange.length > 0 && (
                            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-3 block">Święta w terminie</span>
                                <ul className="space-y-2.5">
                                    {holidaysInRange.map(h => (
                                        <li key={h} className="text-xs text-neutral-700 font-medium flex items-start gap-2.5 group/holiday">
                                            <div className="w-1.5 h-1.5 rounded-full bg-leisure-peach flex-shrink-0 mt-1.5 group-hover/holiday:scale-125 transition-transform"></div>
                                            <span className="leading-snug group-hover/holiday:text-neutral-900 transition-colors">{h}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                     </div>
                </div>

                {/* Visual Calendar (Now Second/Right) - Tooltips Enabled */}
                <div className="flex-1 order-1 xl:order-2">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100 h-full flex flex-col">
                        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-6">Podgląd Kalendarza</h4>
                        
                        <div className="flex-1 flex flex-col md:flex-row gap-8 justify-center items-start">
                            {relevantMonths.map(m => (
                                <div key={m.monthIndex} className="w-full md:w-auto md:flex-1 max-w-[380px]">
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
                        <div className="mt-8 pt-6 border-t border-neutral-100 flex justify-start">
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
                                         <div className="absolute left-0 bottom-full mb-2 w-52 bg-white rounded-xl shadow-xl border border-neutral-100 z-20 py-1 animate-fade-in-up origin-bottom-left">
                                             <div className="px-4 py-2 bg-neutral-50 border-b border-neutral-100 rounded-t-xl">
                                                 <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Eksportuj Termin</span>
                                             </div>
                                             <button 
                                                 onClick={() => handleCalendarAction('google')}
                                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-brand-50 hover:text-brand-700 transition-colors flex items-center gap-2"
                                             >
                                                 <span className="text-base">📅</span>
                                                 <span>Kalendarz Google</span>
                                             </button>
                                             <button 
                                                 onClick={() => handleCalendarAction('ics')}
                                                 className="w-full text-left px-4 py-2.5 text-xs font-medium text-neutral-700 hover:bg-brand-50 hover:text-brand-700 transition-colors flex items-center gap-2"
                                             >
                                                  <span className="text-base">📥</span>
                                                 <span>Plik .ics (Outlook, Apple)</span>
                                             </button>
                                             <div className="border-t border-neutral-100 my-1"></div>
                                             <div className="px-4 py-1.5 text-[10px] text-neutral-400 font-medium text-center">
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
        </div>
    );
};


const seasonPresets = [
  { label: 'Wakacje', months: [6, 7] },
  { label: 'Majówka', months: [4] },
  { label: 'Wiosna', months: [2, 3, 4, 5] },
  { label: 'Lato', months: [5, 6, 7, 8] },
  { label: 'Jesień', months: [8, 9, 10] },
  { label: 'Zima', months: [11, 0, 1] },
];

export const VacationStrategy: React.FC<VacationStrategyProps> = ({ year, precalculatedStrategies, ready, coveredDates, onAdd, onCalendar }) => {
  const strategies = useMemo(() => (precalculatedStrategies ?? analyzeVacationStrategies(year)).filter(strategy => strategy.vacationDays.every(date => validPlanDate(formatDateKey(date)))), [year, precalculatedStrategies]);
  const baseCalendarData = useMemo(() => generateCalendarData(year), [year]);
  const [minFreeDays, setMinFreeDays] = useState(0);
  const [maxCost, setMaxCost] = useState(26);
  const [season, setSeason] = useState('Wszystkie');
  const [sortBy, setSortBy] = useState<'date' | 'efficiency'>('efficiency');
  const [visibleCount, setVisibleCount] = useState(6);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [added, setAdded] = useState<{ id: string; count: number } | null>(null);
  const handledLink = useRef('');
  const selectedMonths = seasonPresets.find(preset => preset.label === season)?.months;
  const filteredStrategies = useMemo(() => strategies.filter(strategy => strategy.freeDays >= minFreeDays && strategy.daysToTake <= maxCost && (!selectedMonths || selectedMonths.includes(strategy.monthIndex)))
    .sort((a, b) => sortBy === 'efficiency' ? b.efficiency - a.efficiency || b.freeDays - a.freeDays || a.startDate.getTime() - b.startDate.getTime() : a.startDate.getTime() - b.startDate.getTime()), [strategies, minFreeDays, maxCost, selectedMonths, sortBy]);
  const hasActiveFilters = minFreeDays > 0 || maxCost < 26 || season !== 'Wszystkie';
  const clearFilters = () => { setMinFreeDays(0); setMaxCost(26); setSeason('Wszystkie'); setVisibleCount(6); };

  useEffect(() => {
    if (!ready) return;
    let frame = 0;
    const receive = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.slice(1));
      if (params.get('sekcja') !== 'strategia' || Number(params.get('rok')) !== year || handledLink.current === hash) return;
      handledLink.current = hash;
      const requested = strategies.find(strategy => strategy.id === params.get('propozycja'));
      clearFilters();
      setSortBy('efficiency');
      // A requested card may be beyond the first six results. Keep it reachable.
      if (requested) { setVisibleCount(strategies.length); setExpandedId(requested.id); }
      frame = requestAnimationFrame(() => {
        const element = document.getElementById(requested ? `strategy-card-${requested.id}` : 'strategia-urlopowa');
        element?.focus({ preventScroll: true });
        element?.scrollIntoView({ block: 'start' });
      });
    };
    receive();
    window.addEventListener('hashchange', receive);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('hashchange', receive); };
  }, [ready, year, strategies]);

  const toggleExpand = (id: string) => {
    if (expandedId !== id) trackEvent({ category: AnalyticsCategory.STRATEGY, action: AnalyticsAction.EXPAND, label: id });
    setExpandedId(current => current === id ? null : id);
  };

  return <section id="strategia-urlopowa" className="planner-full-strategy" aria-labelledby="strategy-heading" tabIndex={-1}>
    <header className="planner-strategy-heading"><div><p className="leave-eyebrow">POMYSŁY NA DŁUŻSZE WOLNE</p><h2 id="strategy-heading">Strategia urlopowa <span>{year}</span></h2><p>Porównaj terminy i dodaj wybrane dni do swojego planu.</p></div><button type="button" className="strategy-back-to-calendar" onClick={() => onCalendar()}>Wróć do kalendarza ↑</button></header>
    <details className="planner-strategy-guide"><summary>Jak działa mostek? <span aria-hidden="true">＋</span></summary><StrategyGuide year={year} /></details>
    <div className="planner-strategy-filters" aria-label="Filtry strategii urlopowej">
      <div className="strategy-seasons" role="group" aria-label="Kiedy chcesz odpocząć?"><span>Kiedy?</span>{['Wszystkie', ...seasonPresets.map(preset => preset.label)].map(label => <button key={label} type="button" aria-pressed={season === label} onClick={() => { setSeason(label); setVisibleCount(6); }}>{label}</button>)}</div>
      <div className="strategy-filter-fields">
        <label htmlFor="strategy-min-days"><span>Min. dni wypoczynku <b>{minFreeDays || 'Dowolnie'}</b></span><input id="strategy-min-days" type="range" min="0" max="26" value={minFreeDays} onChange={event => { setMinFreeDays(Number(event.target.value)); setVisibleCount(6); }} /></label>
        <label htmlFor="strategy-max-cost"><span>Maks. dni urlopu <b>{maxCost === 26 ? 'Bez limitu' : maxCost}</b></span><input id="strategy-max-cost" type="range" min="1" max="26" value={maxCost} onChange={event => { setMaxCost(Number(event.target.value)); setVisibleCount(6); }} /></label>
        <label htmlFor="strategy-sort"><span>Sortuj</span><select id="strategy-sort" value={sortBy} onChange={event => { setSortBy(event.target.value as 'date' | 'efficiency'); setVisibleCount(6); }}><option value="efficiency">Najwięcej wolnego za dzień urlopu</option><option value="date">Najwcześniejsze terminy</option></select></label>
      </div>
    </div>
    <div className="planner-strategy-results"><p role="status">Propozycje: <strong>{filteredStrategies.length}</strong><span> · praca pn–pt</span></p>{hasActiveFilters && <button type="button" onClick={clearFilters}>Wyczyść filtry</button>}</div>
    <div id="propozycje-urlopu" className="planner-strategy-list">{filteredStrategies.slice(0, visibleCount).map(strategy => {
      const isExpanded = expandedId === strategy.id;
      const dates = strategyDateKeys(strategy);
      const missing = dates.filter(date => !coveredDates.has(date));
      const inPlan = ready && missing.length === 0;
      return <article id={`strategy-card-${strategy.id}`} className="planner-strategy-card" key={strategy.id} data-expanded={isExpanded} tabIndex={-1} onClick={event => {
        if ((event.target as HTMLElement).closest('button, a, input, select, summary, [role="region"]') || window.getSelection()?.toString()) return;
        if (!isExpanded) toggleExpand(strategy.id);
      }}>
        <div className="planner-strategy-row"><div className="planner-strategy-period"><h3><button className="strategy-title-toggle" type="button" aria-expanded={isExpanded} aria-controls={`strategy-details-${strategy.id}`} onClick={() => toggleExpand(strategy.id)}>{strategy.periodName || 'Czas na przerwę'}</button></h3><p>{displayRange(formatDateKey(strategy.startDate), formatDateKey(strategy.endDate))}</p><StrategyBadges strategy={strategy} /></div>
          <p className="planner-strategy-numbers"><span><strong>{strategy.daysToTake}</strong><span>dni urlopu</span></span><span aria-hidden="true">→</span><span><strong>{strategy.freeDays}</strong><span>dni wolnego</span></span></p>
          <div className="planner-strategy-actions"><button type="button" className="strategy-add" disabled={!ready || inPlan} onClick={() => { onAdd(missing); setAdded({ id: strategy.id, count: missing.length }); }}>{inPlan ? 'W Twoim planie ✓' : ready && missing.length < dates.length ? `Dodaj brakujące dni (${missing.length}) ＋` : 'Dodaj do planu ＋'}</button><button type="button" className="strategy-details-toggle" aria-expanded={isExpanded} aria-controls={`strategy-details-${strategy.id}`} onClick={() => toggleExpand(strategy.id)}>Szczegóły <span aria-hidden="true">{isExpanded ? '−' : '＋'}</span></button></div>
        </div>
        {added?.id === strategy.id && inPlan && <p className="strategy-added-note" role="status">Dodano {added.count} dni urlopu. <button type="button" onClick={() => onCalendar(dates.find(date => date.startsWith(`${year}-`)) ?? dates[0])}>Zobacz w kalendarzu ↑</button></p>}
        <div id={`strategy-details-${strategy.id}`} hidden={!isExpanded}>{isExpanded && <><div className="strategy-detail-timeline"><StrategyTimeline strategy={strategy} /></div><StrategyExpandedDetails strategy={strategy} year={year} baseCalendarData={baseCalendarData} /></>}</div>
      </article>;
    })}</div>
    {filteredStrategies.length > visibleCount && <button type="button" className="strategy-show-more" onClick={() => setVisibleCount(count => count + 6)}>Pokaż kolejne propozycje <span>({filteredStrategies.length - visibleCount})</span> ↓</button>}
    {filteredStrategies.length === 0 && <div className="planner-strategy-empty"><h3>Brak propozycji dla tych ustawień</h3><p>Zwiększ pulę dni lub zmień termin. Tutaj szukamy co najmniej 2 dni wolnego za każdy dzień urlopu, od 2 dni urlopu.</p><button type="button" onClick={clearFilters}>Wyczyść filtry</button></div>}
  </section>;
};
