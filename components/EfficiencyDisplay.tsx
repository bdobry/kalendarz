import React, { useMemo } from 'react';
import { generateCalendarData, getYearStats } from '../utils/dateUtils';

interface EfficiencyDisplayProps {
  efficiencyClass: string;
  year: number;
  redeemSaturdays: boolean;
}

const CLASSES = [
  { id: 'A', color: 'bg-emerald-800', width: 'w-16', label: 'Lata fantastyczne' },
  { id: 'B', color: 'bg-emerald-600', width: 'w-20', label: 'Lata bardzo dobre' },
  { id: 'C', color: 'bg-emerald-500', width: 'w-24', label: 'Lata z potencjałem' },
  { id: 'D', color: 'bg-lime-500', width: 'w-28', label: 'Lata normalne' },
  { id: 'E', color: 'bg-yellow-400', width: 'w-32', label: 'Lata biedne' },
  { id: 'F', color: 'bg-amber-400', width: 'w-36', label: 'Lata chude' },
  { id: 'G', color: 'bg-red-600', width: 'w-40', label: 'Lata katastrofalne' },
];

export const EfficiencyDisplay: React.FC<EfficiencyDisplayProps> = ({ efficiencyClass, year, redeemSaturdays }) => {
  
  // Calculate historical and future stats for tooltips, depending on redemption toggle
  // Now covering the full supported range 1991-2099 to ensure full distribution visibility
  const yearsByClass = useMemo(() => {
    const map = new Map<string, number[]>();
    CLASSES.forEach(c => map.set(c.id, []));

    const startYear = 1991;
    const endYear = 2099;

    for (let y = startYear; y <= endYear; y++) {
      const data = generateCalendarData(y);
      // Pass redeemSaturdays here to recalculate historical classes dynamically
      const stats = getYearStats(data, redeemSaturdays);
      const currentList = map.get(stats.efficiencyClass);
      if (currentList) {
        currentList.push(y);
      }
    }
    return map;
  }, [redeemSaturdays]); // Recalculate if redemption setting changes

  return (
    <div className="bg-canvas-default rounded-xl p-6 shadow-xs border border-neutral-200/60 flex flex-col h-[440px] relative transition-all hover:shadow-sm">
      <div className="mb-6 flex justify-between items-start">
        <h3 className="text-lg font-bold text-neutral-800 leading-tight tracking-tight">
          Klasa Efektywności<br/>Świątecznej
        </h3>
        <span className="text-sm font-bold font-mono text-neutral-500 bg-neutral-100/50 px-2 py-1 rounded-md border border-neutral-100">{year}</span>
      </div>
      
      {/* Container with right padding to prevent arrow overflow */}
      <div className="flex-1 flex flex-col gap-1.5 relative pr-16">
        {CLASSES.map((c) => {
          const yearsList = yearsByClass.get(c.id) || [];
          const hasYears = yearsList.length > 0;
          
          return (
            <div key={c.id} className="relative flex items-center h-8 group cursor-default">
              {/* The colored bar */}
              <div 
                className={`h-full ${c.width} ${c.color} rounded-r-md flex items-center pl-3 shadow-sm z-0 relative transition-transform group-hover:scale-[1.02] origin-left`}
              >
                <span className="text-white font-bold text-sm drop-shadow-md">{c.id}</span>
              </div>

              {/* Tooltip for Years */}
              {hasYears && (
                <div className="absolute left-0 bottom-full mb-1 ml-4 hidden group-hover:block z-50 w-64">
                   <div className="bg-neutral-800 text-neutral-200 text-xs p-3 rounded-lg shadow-xl border border-neutral-700">
                     <div className="font-bold text-white mb-1 border-b border-neutral-600 pb-1">{c.label} ({c.id}):</div>
                     <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                       {yearsList.map(y => (
                         <span key={y} className={`px-1 rounded ${y === year ? 'bg-white text-neutral-900 font-bold' : ''}`}>
                           {y}
                         </span>
                       ))}
                     </div>
                   </div>
                   {/* Tooltip Arrow */}
                   <div className="absolute left-4 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-neutral-800"></div>
                </div>
              )}

              {/* The Active Indicator Arrow */}
              {efficiencyClass === c.id && (
                  <div className="absolute left-full ml-2 flex items-center animate-in fade-in slide-in-from-left-2 duration-500 z-10 pointer-events-none">
                    {/* Arrow Tip */}
                    <div className="w-0 h-0 border-t-[10px] border-t-transparent border-r-[14px] border-r-neutral-900 border-b-[10px] border-b-transparent -mr-[1px]"></div>
                    {/* Box */}
                    <div className="bg-neutral-900 text-white text-xl font-bold h-10 w-12 flex items-center justify-center rounded shadow-lg">
                      {c.id}
                    </div>
                  </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-auto pt-4 border-t border-neutral-100">
        <p className="text-[11px] text-neutral-400 leading-relaxed mb-2">
          Im więcej świąt w dni robocze i długich weekendów, tym wyższa klasa.
        </p>
      </div>
    </div>
  );
};
