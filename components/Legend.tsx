import React from 'react';

// SVG data for wavy line matching DayCell
const WAVY_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4' viewBox='0 0 6 4'%3E%3Cpath d='M0 2 Q1.5 0.5 3 2 T6 2' fill='none' stroke='%23a64f2c' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`;

export const Legend: React.FC = () => {
  return (
    <div className="">
      <div className="flex flex-wrap justify-end items-center gap-4 text-[10px] text-neutral-500">
          
        <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded-[5px] bg-neutral-50 border border-neutral-100 flex items-center justify-center text-neutral-500">So</div>
            <span>Weekend</span>
        </div>

        <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded-[5px] bg-transparent border border-brand-100 text-brand-700 font-bold flex items-center justify-center">
              1
            </div>
            <span>Święto</span>
        </div>

        <div className="hidden sm:block h-4 w-px bg-neutral-100"></div>

        {/* Natural Long Weekend (3 blocks: Pt, Sb, Nd) */}
        <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-r-0 rounded-l-[5px] flex items-center justify-center text-[10px] text-neutral-600">Pt</div>
              <div className="w-5 h-6 bg-leisure-lilac/60 border-y border-brand-200 flex items-center justify-center text-[10px] text-neutral-500">Sb</div>
              <div className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-l-0 rounded-r-[5px] flex items-center justify-center text-[10px] text-neutral-500">Nd</div>
            </div>
            <span>Długi weekend</span>
        </div>

        {/* Potential Long Weekend (Bridge) */}
        <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-r-0 rounded-l-[5px] flex items-center justify-center text-[10px] text-neutral-600">Pt</div>
              
              {/* The Bridge Cell representation */}
              <div className="relative w-5 h-6 bg-leisure-peach/60 flex items-center justify-center text-[10px] text-neutral-600 z-10">
                  <div className="absolute -top-[1px] left-0 right-0 h-[4px] w-full" style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }} />
                  <div className="absolute -bottom-[1px] left-0 right-0 h-[4px] w-full" style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }} />
                  Pn
              </div>
              
              <div className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-l-0 rounded-r-[5px] flex items-center justify-center text-[10px] text-neutral-600">Wt</div>
            </div>
            <span>Potencjalny długi weekend (z mostkiem)</span>
        </div>

      </div>
    </div>
  );
};
