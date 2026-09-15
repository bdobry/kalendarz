import React from 'react';
import { YearStats, GlobalStats, StatRange } from '../types';

interface StatsGridProps {
  stats: YearStats;
  globalStats: GlobalStats;
  redeemSaturdays: boolean;
  year: number;
}

// Reusable Tooltip Component for the distribution bar
const BarTooltip = ({ title, current, stats, alignEnd = false }: { title: string, current: number, stats: StatRange, alignEnd?: boolean }) => (
  <div className={`year-stat-tooltip absolute bottom-full mb-2 ${alignEnd ? 'right-0' : 'left-1/2 -translate-x-1/2'} bg-neutral-800 text-white p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-40 border border-neutral-700`}>
     <div className="text-xs font-bold border-b border-neutral-600 pb-1 mb-2 text-center">{title}</div>
     <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] text-neutral-400">Ten rok</span>
        <span className="text-xl font-bold leading-none">{current}</span>
     </div>
     <div className="grid grid-cols-3 gap-1 pt-1 border-t border-neutral-600/50 text-center">
        <div>
          <div className="text-[9px] text-neutral-400">Min</div>
          <div className="text-xs font-mono">{stats.min}</div>
        </div>
        <div>
          <div className="text-[9px] text-leisure-ink">Śr</div>
          <div className="text-xs font-mono text-leisure-ink">{stats.avg}</div>
        </div>
        <div>
          <div className="text-[9px] text-neutral-400">Max</div>
          <div className="text-xs font-mono">{stats.max}</div>
        </div>
     </div>
     {/* Arrow */}
     <div className={`absolute top-full ${alignEnd ? 'right-3' : 'left-1/2 -translate-x-1/2'} border-4 border-transparent border-t-neutral-800`}></div>
  </div>
);

// Mini stat row for bottom cards (Hidden by default, shown on hover)
const HoverStatRow = ({ stats }: { stats: StatRange }) => (
  <div className="flex justify-between w-full px-4 pt-2 border-t border-neutral-200/50">
     <div className="flex flex-col items-center">
        <span className="text-[9px] text-neutral-400 uppercase">Min</span>
        <span className="text-[10px] font-mono font-bold text-neutral-600">{stats.min}</span>
     </div>
     <div className="flex flex-col items-center">
        <span className="text-[9px] text-neutral-400 uppercase">Śr</span>
        <span className="text-[10px] font-mono font-bold text-neutral-600">{stats.avg}</span>
     </div>
     <div className="flex flex-col items-center">
        <span className="text-[9px] text-neutral-400 uppercase">Max</span>
        <span className="text-[10px] font-mono font-bold text-neutral-600">{stats.max}</span>
     </div>
  </div>
);

// Trend Indicator (Arrow)
const TrendArrow = ({ current, avg }: { current: number, avg: number }) => {
    const diff = current - avg;
    // Consider it "average" if within 0.5 range
    if (Math.abs(diff) < 0.5) return <span className="text-neutral-300 text-lg leading-none" title="W normie">•</span>;
    
    if (diff > 0) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-leisure-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
            </svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-leisure-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
        </svg>
    );
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, globalStats, redeemSaturdays, year }) => {
  
  // Calculate percentages for the distribution bar
  const totalRaw = stats.holidaysOnWorkdays + stats.holidaysOnSaturdays + stats.holidaysOnSundays;
  const pctWork = totalRaw > 0 ? (stats.holidaysOnWorkdays / totalRaw) * 100 : 0;
  const pctSat = totalRaw > 0 ? (stats.holidaysOnSaturdays / totalRaw) * 100 : 0;
  const pctSun = totalRaw > 0 ? (stats.holidaysOnSundays / totalRaw) * 100 : 0;
  
  const handleScrollTo = (id: string) => {
      const el = document.getElementById(id);
      if (el) {
          const details = el.closest('details');
          if (details) details.open = true;
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Animate children (chips) instead of the container
          // We select immediate children divs (the chips)
          const chips = el.querySelectorAll('div > div'); // Adjust selector based on structure. The list renders divs inside the container div.
          // Or specifically target the chips wrapper
          // Structure in HolidayList: via ID 'long-weekends-list' -> div class="flex..." -> chips
          
          // Let's rely on the structure: #id > div > div.group
          const children = el.getElementsByClassName('group');
          
          Array.from(children).forEach((child, index) => {
             // Staggered animation
             setTimeout(() => {
                 child.classList.add('ring-2', 'ring-offset-1', 'scale-101');
                 if (id.includes('potential')) {
                     child.classList.add('ring-leisure-copper/25');
                 } else {
                     child.classList.add('ring-leisure-ink/20');
                 }
             }, index * 50);

             // Cleanup
             setTimeout(() => {
                 child.classList.remove('ring-2', 'ring-offset-1', 'scale-101', 'ring-leisure-copper/25', 'ring-leisure-ink/20');
             }, 1000 + (index * 50));
          });
      } else {
          // Fallback
          const sec = document.getElementById('long-weekends-section');
          if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  return (
    <div className="year-panel year-balance bg-canvas-default rounded-xl p-6 shadow-xs border border-neutral-200/60 flex flex-col h-[460px] relative overflow-visible z-10 transition-all hover:shadow-sm">
      
      <div className="mb-6 flex justify-between items-start">
        <h3 className="text-lg font-bold text-neutral-800 leading-tight tracking-tight">Bilans wolnego w roku</h3>
        <span className="year-number-tag text-sm font-bold font-mono text-neutral-500 bg-neutral-100/50 px-2 py-1 rounded-md border border-neutral-100">{year}</span>
      </div>

      {/* HERO STAT: Effective Days */}
      <div className="flex-1 flex flex-col items-center justify-center mb-6">
        <div className="relative">
          <span className="text-8xl font-black text-neutral-900 tracking-tighter">
            {stats.effectiveDays}
          </span>
          <span className="year-days-stamp absolute -top-2 -right-6 bg-brand-50 text-brand-600 text-xs font-bold px-2 py-1 rounded-full border border-brand-100">
            DNI
          </span>
        </div>
        <p className="text-neutral-500 font-medium text-sm mt-1">
           Dni wolnego dzięki świętom
        </p>
        
        {/* Min / Max / Avg Context Pill */}
        <div className="year-stat-context flex gap-3 text-[10px] text-neutral-400 mt-2 font-mono bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
           <span>Min: <b className="text-neutral-600">{globalStats.effectiveDays.min}</b></span>
           <span className="text-neutral-300">|</span>
           <span>Śr: <b className="text-leisure-ink">{globalStats.effectiveDays.avg}</b></span>
           <span className="text-neutral-300">|</span>
           <span>Max: <b className="text-neutral-600">{globalStats.effectiveDays.max}</b></span>
        </div>
      </div>

      {/* DISTRIBUTION BAR */}
      <div className="mb-6">
         <div className="flex justify-between text-[11px] font-bold text-neutral-500 mb-2 uppercase tracking-wide">
            <span>Rozkład świąt</span>
            <span>{totalRaw} dni łącznie</span>
         </div>
         <div className="year-distribution h-4 w-full rounded-full flex relative">
            {/* Workdays */}
            <div style={{ width: `${pctWork}%` }} className="h-full balance-weekdays transition-colors relative group first:rounded-l-full last:rounded-r-full">
                <BarTooltip title="W Tygodniu (Pn-Pt)" current={stats.holidaysOnWorkdays} stats={globalStats.holidaysOnWorkdays} />
            </div>
            {/* Saturdays */}
            <div style={{ width: `${pctSat}%` }} className="h-full balance-saturdays transition-colors relative group first:rounded-l-full last:rounded-r-full">
                 <BarTooltip title="W Soboty" current={stats.holidaysOnSaturdays} stats={globalStats.holidaysOnSaturdays} />
            </div>
            {/* Sundays */}
            <div style={{ width: `${pctSun}%` }} className="h-full balance-sundays transition-colors relative group first:rounded-l-full last:rounded-r-full">
                <BarTooltip alignEnd title="W Niedziele" current={stats.holidaysOnSundays} stats={globalStats.holidaysOnSundays} />
            </div>
         </div>
         <div className="flex justify-between mt-2 text-[10px] text-neutral-400 font-medium">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full balance-weekdays"></div>Pn-Pt</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full balance-saturdays"></div>Sob</div>
             <div className="flex items-center gap-1"><div className="balance-legend-dot w-2 h-2 rounded-full balance-sundays"></div>Ndz</div>
         </div>
      </div>

      {/* BOTTOM METRICS */}
      <div className="grid grid-cols-2 gap-3 mt-auto h-32">
         {/* Long Weekends Card */}
         <div 
            onClick={() => handleScrollTo('long-weekends-list')}
            className="year-metric bg-neutral-50/50 rounded-xl p-2 relative group flex flex-col items-center border border-neutral-100 overflow-hidden cursor-pointer hover:shadow-sm hover:bg-white hover:border-brand-200 transition-all active:scale-[0.98]"
          >
             <span className="text-[9px] uppercase tracking-wide text-neutral-500 font-bold mb-1 text-center mt-1 group-hover:opacity-100 transition-opacity">Długie Weekendy</span>
             
             <div className="flex-1 w-full flex items-center justify-center gap-2 transition-all duration-300 group-hover:-translate-y-1">
                 <span className="text-3xl font-bold text-neutral-800">{stats.longWeekendsCount}</span>
                 <TrendArrow current={stats.longWeekendsCount} avg={globalStats.longWeekendsCount.avg} />
             </div>

             {/* Hover Details */}
             <div className="absolute bottom-0 left-0 right-0 pb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 bg-neutral-50">
                <HoverStatRow stats={globalStats.longWeekendsCount} />
             </div>
          </div>
                  {/* Potential Long Weekends (Bridges) Card */}
          <div 
            onClick={() => handleScrollTo('potential-weekends-list')}
            className="year-metric year-metric-potential rounded-2xl p-2 relative group flex flex-col items-center overflow-hidden cursor-pointer transition-all active:scale-[0.98]"
          >
             <span className="text-[9px] uppercase tracking-wide text-neutral-600 font-bold mb-1 text-center mt-1 w-full px-1 group-hover:opacity-100 transition-opacity">Potencjalne Długie Weekendy</span>
             
             <div className="flex-1 w-full flex items-center justify-center gap-2 transition-all duration-300 group-hover:-translate-y-1">
                  <span className="text-3xl font-bold text-neutral-800">{stats.bridgeDaysCount}</span>
                  <TrendArrow current={stats.bridgeDaysCount} avg={globalStats.bridgeDaysCount.avg} />
             </div>

             {/* Hover Details */}
             <div className="year-metric-potential-hover absolute bottom-0 left-0 right-0 pb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                 <HoverStatRow stats={globalStats.bridgeDaysCount} />
             </div>
          </div>
      </div>

    </div>
  );
};
