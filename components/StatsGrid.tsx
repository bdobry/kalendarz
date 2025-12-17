import React from 'react';
import { YearStats, GlobalStats, StatRange } from '../types';

interface StatsGridProps {
  stats: YearStats;
  globalStats: GlobalStats;
  redeemSaturdays: boolean;
}

// Reusable Tooltip Component for the distribution bar
const BarTooltip = ({ title, current, stats }: { title: string, current: number, stats: StatRange }) => (
  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-neutral-800 text-white p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-40 border border-neutral-700">
     <div className="text-xs font-bold border-b border-neutral-600 pb-1 mb-2 text-center">{title}</div>
     <div className="flex justify-between items-end mb-2">
        <span className="text-[10px] text-slate-400">Ten rok</span>
        <span className="text-xl font-bold leading-none">{current}</span>
     </div>
     <div className="grid grid-cols-3 gap-1 pt-1 border-t border-slate-600/50 text-center">
        <div>
          <div className="text-[9px] text-slate-400">Min</div>
          <div className="text-xs font-mono">{stats.min}</div>
        </div>
        <div>
          <div className="text-[9px] text-emerald-400">Śr</div>
          <div className="text-xs font-mono text-emerald-400">{stats.avg}</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-400">Max</div>
          <div className="text-xs font-mono">{stats.max}</div>
        </div>
     </div>
     {/* Arrow */}
     <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
  </div>
);

// Mini stat row for bottom cards (Hidden by default, shown on hover)
const HoverStatRow = ({ stats }: { stats: StatRange }) => (
  <div className="flex justify-between w-full px-4 pt-2 border-t border-slate-200/50">
     <div className="flex flex-col items-center">
        <span className="text-[9px] text-slate-400 uppercase">Min</span>
        <span className="text-[10px] font-mono font-bold text-slate-600">{stats.min}</span>
     </div>
     <div className="flex flex-col items-center">
        <span className="text-[9px] text-slate-400 uppercase">Śr</span>
        <span className="text-[10px] font-mono font-bold text-slate-600">{stats.avg}</span>
     </div>
     <div className="flex flex-col items-center">
        <span className="text-[9px] text-slate-400 uppercase">Max</span>
        <span className="text-[10px] font-mono font-bold text-slate-600">{stats.max}</span>
     </div>
  </div>
);

// Trend Indicator (Arrow)
const TrendArrow = ({ current, avg }: { current: number, avg: number }) => {
    const diff = current - avg;
    // Consider it "average" if within 0.5 range
    if (Math.abs(diff) < 0.5) return <span className="text-slate-300 text-lg leading-none" title="W normie">•</span>;
    
    if (diff > 0) {
        return (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5" />
                <path d="m5 12 7-7 7 7" />
            </svg>
        );
    }
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
        </svg>
    );
}

export const StatsGrid: React.FC<StatsGridProps> = ({ stats, globalStats, redeemSaturdays }) => {
  
  // Calculate percentages for the distribution bar
  const totalRaw = stats.holidaysOnWorkdays + stats.holidaysOnSaturdays + stats.holidaysOnSundays;
  const pctWork = totalRaw > 0 ? (stats.holidaysOnWorkdays / totalRaw) * 100 : 0;
  const pctSat = totalRaw > 0 ? (stats.holidaysOnSaturdays / totalRaw) * 100 : 0;
  const pctSun = totalRaw > 0 ? (stats.holidaysOnSundays / totalRaw) * 100 : 0;
  
  const handleScrollTo = (id: string) => {
      const el = document.getElementById(id);
      if (el) {
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
                     child.classList.add('ring-amber-300');
                 } else {
                     child.classList.add('ring-emerald-300');
                 }
             }, index * 50);

             // Cleanup
             setTimeout(() => {
                 child.classList.remove('ring-2', 'ring-offset-1', 'scale-101', 'ring-amber-300', 'ring-emerald-300');
             }, 1000 + (index * 50));
          });
      } else {
          // Fallback
          const sec = document.getElementById('long-weekends-section');
          if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
  };

  return (
    <div className="bg-canvas-default rounded-xl p-6 shadow-xs border border-neutral-200/60 flex flex-col h-[440px] relative overflow-visible z-10 transition-all hover:shadow-sm">
      
      <div className="mb-4">
        <h3 className="text-lg font-bold text-neutral-800 leading-tight tracking-tight">Bilans Roku</h3>
      </div>

      {/* HERO STAT: Effective Days */}
      <div className="flex-1 flex flex-col items-center justify-center mb-6">
        <div className="relative">
          <span className="text-8xl font-black text-neutral-900 tracking-tighter">
            {stats.effectiveDays}
          </span>
          <span className="absolute -top-2 -right-6 bg-brand-50 text-brand-600 text-xs font-bold px-2 py-1 rounded-full border border-brand-100">
            DNI
          </span>
        </div>
        <p className="text-neutral-500 font-medium text-sm mt-1">
           Wolnych od pracy
        </p>
        
        {/* Min / Max / Avg Context Pill */}
        <div className="flex gap-3 text-[10px] text-neutral-400 mt-2 font-mono bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
           <span>Min: <b className="text-neutral-600">{globalStats.effectiveDays.min}</b></span>
           <span className="text-neutral-300">|</span>
           <span>Śr: <b className="text-emerald-500">{globalStats.effectiveDays.avg}</b></span>
           <span className="text-neutral-300">|</span>
           <span>Max: <b className="text-neutral-600">{globalStats.effectiveDays.max}</b></span>
        </div>
      </div>

      {/* DISTRIBUTION BAR */}
      <div className="mb-6">
         <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wide">
            <span>Rozkład świąt</span>
            <span>{totalRaw} dni łącznie</span>
         </div>
         <div className="h-4 w-full bg-slate-100 rounded-full flex relative">
            {/* Workdays */}
            <div style={{ width: `${pctWork}%` }} className="h-full bg-emerald-500 hover:bg-emerald-400 transition-colors relative group first:rounded-l-full last:rounded-r-full">
                <BarTooltip title="W Tygodniu (Pn-Pt)" current={stats.holidaysOnWorkdays} stats={globalStats.holidaysOnWorkdays} />
            </div>
            {/* Saturdays */}
            <div style={{ width: `${pctSat}%` }} className="h-full bg-blue-500 hover:bg-blue-400 transition-colors relative group first:rounded-l-full last:rounded-r-full">
                 <BarTooltip title="W Soboty" current={stats.holidaysOnSaturdays} stats={globalStats.holidaysOnSaturdays} />
            </div>
            {/* Sundays */}
            <div style={{ width: `${pctSun}%` }} className="h-full bg-rose-400 hover:bg-rose-300 transition-colors relative group first:rounded-l-full last:rounded-r-full">
                <BarTooltip title="W Niedziele" current={stats.holidaysOnSundays} stats={globalStats.holidaysOnSundays} />
            </div>
         </div>
         <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium">
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>Pn-Pt</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Sob</div>
             <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"></div>Ndz</div>
         </div>
      </div>

      {/* BOTTOM METRICS */}
      <div className="grid grid-cols-2 gap-3 mt-auto h-32">
         {/* Long Weekends Card */}
         <div 
            onClick={() => handleScrollTo('long-weekends-list')}
            className="bg-neutral-50/50 rounded-xl p-2 relative group flex flex-col items-center border border-neutral-100 overflow-hidden cursor-pointer hover:shadow-sm hover:bg-white hover:border-brand-200 transition-all active:scale-[0.98]"
          >
             <span className="text-[9px] uppercase tracking-wide text-slate-500 font-bold mb-1 text-center mt-1 group-hover:opacity-100 transition-opacity">Długie Weekendy</span>
             
             <div className="flex-1 w-full flex items-center justify-center gap-2 transition-all duration-300 group-hover:-translate-y-1">
                 <span className="text-3xl font-bold text-slate-800">{stats.longWeekendsCount}</span>
                 <TrendArrow current={stats.longWeekendsCount} avg={globalStats.longWeekendsCount.avg} />
             </div>

             {/* Hover Details */}
             <div className="absolute bottom-0 left-0 right-0 pb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 bg-slate-50">
                <HoverStatRow stats={globalStats.longWeekendsCount} />
             </div>
          </div>
                  {/* Potential Long Weekends (Bridges) Card */}
          <div 
            onClick={() => handleScrollTo('potential-weekends-list')}
            className="bg-amber-50 rounded-2xl p-2 relative group flex flex-col items-center border border-amber-100 overflow-hidden cursor-pointer hover:shadow-md hover:border-amber-300 transition-all active:scale-[0.98]"
          >
             <span className="text-[9px] uppercase tracking-wide text-amber-700/70 font-bold mb-1 text-center mt-1 w-full px-1 group-hover:opacity-100 transition-opacity">Potencjalne Długie Weekendy</span>
             
             <div className="flex-1 w-full flex items-center justify-center gap-2 transition-all duration-300 group-hover:-translate-y-1">
                  <span className="text-3xl font-bold text-amber-600">{stats.bridgeDaysCount}</span>
                  <TrendArrow current={stats.bridgeDaysCount} avg={globalStats.bridgeDaysCount.avg} />
             </div>

             {/* Hover Details */}
             <div className="absolute bottom-0 left-0 right-0 pb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 bg-amber-50">
                 <HoverStatRow stats={globalStats.bridgeDaysCount} />
             </div>
          </div>
      </div>

    </div>
  );
};
