import React from 'react';

// SVG data for wavy line matching DayCell
const WAVY_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4' viewBox='0 0 6 4'%3E%3Cpath d='M0 2 Q1.5 0.5 3 2 T6 2' fill='none' stroke='%23f59e0b' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`;

export const Legend: React.FC = () => {
  return (
    <div className="mt-8 border-t border-slate-200 bg-white/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-wrap justify-between items-center gap-4 text-xs text-slate-500">
          
          <div className="flex items-center gap-2">
             <div className="w-8 h-6 rounded bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">So</div>
             <span>Weekend</span>
          </div>

          <div className="flex items-center gap-2">
             <div className="w-8 h-6 rounded bg-indigo-50/30 border border-indigo-100 text-indigo-700 font-bold flex items-center justify-center relative">
               <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-rose-500"></span>
               1
             </div>
             <span>Święto</span>
          </div>

          <div className="hidden sm:block h-4 w-px bg-slate-200"></div>

          {/* Natural Long Weekend (3 blocks: Pt, Sb, Nd) */}
          <div className="flex items-center gap-2">
             <div className="flex items-center">
                <div className="w-5 h-6 bg-indigo-50/60 border border-indigo-200 border-r-0 rounded-l flex items-center justify-center text-[10px] text-indigo-900/70">Pt</div>
                <div className="w-5 h-6 bg-indigo-50/60 border-y border-indigo-200 flex items-center justify-center text-[10px] font-bold text-indigo-700">Sb</div>
                <div className="w-5 h-6 bg-indigo-50/60 border border-indigo-200 border-l-0 rounded-r flex items-center justify-center text-[10px] text-indigo-900/70">Nd</div>
             </div>
             <span>Długi weekend</span>
          </div>

          {/* Potential Long Weekend (Bridge) */}
          <div className="flex items-center gap-2">
             <div className="flex items-center">
                <div className="w-5 h-6 bg-indigo-50/60 border border-indigo-200 border-r-0 rounded-l flex items-center justify-center text-[10px] text-indigo-900/70">Pt</div>
                
                {/* The Bridge Cell representation */}
                <div className="relative w-5 h-6 bg-amber-50/60 flex items-center justify-center text-[10px] font-bold text-amber-600 z-10">
                   <div className="absolute -top-[1px] left-0 right-0 h-[4px] w-full" style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }} />
                   <div className="absolute -bottom-[1px] left-0 right-0 h-[4px] w-full" style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }} />
                   Pn
                </div>
                
                <div className="w-5 h-6 bg-indigo-50/60 border border-indigo-200 border-l-0 rounded-r flex items-center justify-center text-[10px] text-indigo-900/70">Wt</div>
             </div>
             <span>Potencjalny długi weekend (z mostkiem)</span>
          </div>

        </div>
      </div>
    </div>
  );
};
