import React from 'react';
import { DayInfo } from '../types';

interface HolidayListProps {
  longWeekendOpportunities: DayInfo[];
  allHolidays: DayInfo[];
  redeemSaturdays: boolean;
}

const formatDate = (date: Date) => {
  if (!date || isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long' }).format(date);
  } catch (e) {
    return date.toLocaleDateString();
  }
};

const formatDateShort = (date: Date) => {
  if (!date || isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(date);
  } catch (e) {
    return '';
  }
};

const getDayName = (date: Date) => {
  if (!date || isNaN(date.getTime())) return '';
  try {
    const name = new Intl.DateTimeFormat('pl-PL', { weekday: 'long' }).format(date);
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch (e) {
    return '';
  }
};

const getDayNameShort = (date: Date) => {
    if (!date || isNaN(date.getTime())) return '';
    try {
      const name = new Intl.DateTimeFormat('pl-PL', { weekday: 'short' }).format(date);
      return name.charAt(0).toUpperCase() + name.slice(1);
    } catch (e) {
      return '';
    }
}

export const HolidayList: React.FC<HolidayListProps> = ({ longWeekendOpportunities, allHolidays, redeemSaturdays }) => {
  
  // Sort holidays by date
  const sortedHolidays = [...allHolidays].sort((a, b) => a.date.getTime() - b.date.getTime());

  const handleJumpToDay = (date: Date) => {
    if (!date) return;
    try {
      const id = `day-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Temporary flash effect - Darken background
        // Use !important to override the specific DayCell background classes
        element.classList.add('!bg-amber-200', 'transition-colors', 'duration-500');
        
        setTimeout(() => {
          element.classList.remove('!bg-amber-200');
        }, 1000);
      }
    } catch (e) {
      console.warn('Scroll to day failed', e);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[420px] relative">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-800 leading-tight">Strategia Urlopowa</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        
        {/* SECTION 1: SMART MOVES (Bridges) */}
        {longWeekendOpportunities.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Sprytne ruchy (Mostki)
            </h4>
            <div className="space-y-2">
              {longWeekendOpportunities.map((day, i) => (
                <button 
                  key={i} 
                  onClick={() => handleJumpToDay(day.date)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100 group hover:border-amber-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                     {/* Day Name Box */}
                     <div className="bg-white text-amber-600 font-bold text-xs w-10 h-9 flex items-center justify-center rounded shadow-sm border border-amber-100 uppercase">
                        {getDayNameShort(day.date)}
                     </div>
                     <div>
                       {/* Header: Weź urlop DD/MM */}
                       <div className="text-sm font-bold text-slate-700 group-hover:text-amber-700 transition-colors">
                           Weź urlop {formatDateShort(day.date)}
                       </div>
                       <div className="text-[10px] text-slate-500">Razem 4 dni wolnego</div>
                     </div>
                  </div>
                  <div className="text-xl opacity-30 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-200">👉</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: TIMELINE */}
        <div>
           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Kalendarium</h4>
           <div className="relative pl-4 space-y-0">
             {/* Vertical Line */}
             <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-slate-100 rounded-full"></div>

             {sortedHolidays.map((day, i) => {
               const isSunday = day.date.getDay() === 0;
               const isSaturday = day.date.getDay() === 6;
               const showRedeemBadge = isSaturday && redeemSaturdays;
               
               let dotColor = "bg-emerald-400 ring-emerald-100";
               
               if (isSunday) {
                 dotColor = "bg-rose-300 ring-rose-50";
               } else if (isSaturday) {
                 // Saturday is "neutral" unless redeemable
                 dotColor = showRedeemBadge ? "bg-blue-400 ring-blue-50" : "bg-slate-300 ring-slate-100";
               }

               return (
                 <div key={i} className="relative pl-6 py-2.5 group">
                    {/* Dot */}
                    <div className={`absolute left-0 top-[18px] -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ring-2 ${dotColor} z-10`}></div>
                    
                    <div className="flex flex-col">
                      {/* DATE (Highlighted) */}
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isSunday ? 'text-rose-400 decoration-rose-200 line-through' : 'text-slate-800'}`}>
                           {formatDate(day.date)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                           {getDayName(day.date)}
                        </span>
                        
                        {/* Mini Badge */}
                        {showRedeemBadge && <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-100">Odbiór</span>}
                      </div>

                      {/* NAME (Secondary) */}
                      <div className="text-xs text-slate-500 mt-0.5">
                        {day.holidayName}
                      </div>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>

      </div>
    </div>
  );
};