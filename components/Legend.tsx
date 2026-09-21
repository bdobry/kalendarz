import { LeaveWave } from './LeaveWave';
import React from 'react';


export const Legend: React.FC<{ interactive?: boolean; hasDonations?: boolean; hasLeave?: boolean; context?: 'leave' | 'donations' }> = ({ interactive = false, hasDonations = false, hasLeave = true, context = 'leave' }) => {
  return (
    <div className="calendar-legend">
      <div className="flex flex-wrap justify-start items-center gap-4 text-[10px] text-neutral-500">
          
        <div className="flex items-center gap-2">
            <div data-calendar-swatch="weekend" className="w-8 h-6 rounded-[5px] bg-leisure-lilac/60 border border-brand-100 flex items-center justify-center text-neutral-500">So</div>
            <span>Weekend</span>
        </div>

        <div className="flex items-center gap-2">
            <div data-calendar-swatch="holiday" className="w-8 h-6 rounded-[5px] bg-transparent border border-brand-100 text-holiday font-bold flex items-center justify-center">
              1
            </div>
            <span>Święto</span>
        </div>

        <div className="hidden sm:block h-4 w-px bg-neutral-100"></div>

        {/* Natural Long Weekend (3 blocks: Pt, Sb, Nd) */}
        <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div data-calendar-swatch="free" className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-r-0 rounded-l-[5px] flex items-center justify-center text-[10px] text-neutral-600">Pt</div>
              <div data-calendar-swatch="weekend-sequence" className="w-5 h-6 bg-leisure-lilac/60 border-y border-brand-200 flex items-center justify-center text-[10px] text-neutral-500">So</div>
              <div data-calendar-swatch="weekend-sequence" className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-l-0 rounded-r-[5px] flex items-center justify-center text-[10px] text-neutral-500">Nd</div>
            </div>
            <span>Długi weekend</span>
        </div>

        {/* Potential Long Weekend (Bridge) */}
        {context !== 'donations' && <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div data-calendar-swatch="free" className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-r-0 rounded-l-[5px] flex items-center justify-center text-[10px] text-neutral-600">Pt</div>
              
              {/* The Bridge Cell representation */}
              <div data-calendar-swatch="suggestion" className="shaped-bridge relative w-5 h-6 bg-leisure-lime/60 flex items-center justify-center text-[10px] text-neutral-600 z-10">
                  <LeaveWave />
                  Pn
              </div>
              
              <div data-calendar-swatch="free" className="w-5 h-6 bg-leisure-lilac/60 border border-brand-200 border-l-0 rounded-r-[5px] flex items-center justify-center text-[10px] text-neutral-600">Wt</div>
            </div>
            <span>{interactive ? 'Proponowany mostek' : 'Urlop / mostek'}</span>
        </div>}

        {interactive && <div className="flex flex-wrap items-center gap-4" role="group" aria-label="Oznaczenia Twojego planu">
          {(context !== 'donations' || hasLeave) && <div className="flex items-center gap-2 whitespace-nowrap"><span className="calendar-selected-swatch" aria-hidden="true" /><span>Twój urlop</span></div>}
          {(hasDonations || context === 'donations') && <div className="flex items-center gap-2 whitespace-nowrap"><span className="calendar-selected-swatch calendar-donation-swatch" aria-hidden="true" /><span>Donacja + dzień po</span></div>}
        </div>}

      </div>
    </div>
  );
};
