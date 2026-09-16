import { LEAVE_WAVE } from '../utils/calendarVisuals';
import React from 'react';


export const Legend: React.FC = () => {
  return (
    <div className="calendar-legend">
      <div className="flex flex-wrap justify-start items-center gap-4 text-[10px] text-neutral-500">
          
        <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded-[5px] bg-leisure-lilac/60 border border-brand-100 flex items-center justify-center text-neutral-500">So</div>
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
              <div className="w-5 h-6 bg-leisure-lilac/60 border-y border-brand-200 flex items-center justify-center text-[10px] text-neutral-500">So</div>
              <div className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-l-0 rounded-r-[5px] flex items-center justify-center text-[10px] text-neutral-500">Nd</div>
            </div>
            <span>Długi weekend</span>
        </div>

        {/* Potential Long Weekend (Bridge) */}
        <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-r-0 rounded-l-[5px] flex items-center justify-center text-[10px] text-neutral-600">Pt</div>
              
              {/* The Bridge Cell representation */}
              <div className="relative w-5 h-6 bg-leisure-lime/60 flex items-center justify-center text-[10px] text-neutral-600 z-10">
                  <div className="absolute -top-[1px] left-0 right-0 h-[4px] w-full" style={{ backgroundImage: LEAVE_WAVE, backgroundRepeat: 'repeat-x' }} />
                  <div className="absolute -bottom-[1px] left-0 right-0 h-[4px] w-full" style={{ backgroundImage: LEAVE_WAVE, backgroundRepeat: 'repeat-x' }} />
                  Pn
              </div>
              
              <div className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-l-0 rounded-r-[5px] flex items-center justify-center text-[10px] text-neutral-600">Wt</div>
            </div>
            <span>Urlop / mostek</span>
        </div>

      </div>
    </div>
  );
};
