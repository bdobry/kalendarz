import React from 'react';
import { DayInfo, DayType } from '../types';

interface DayCellProps {
  day: DayInfo;
}

// SVG data for wavy line (amber-500)
// Path creates a sine-like wave ~ centered in 4px height
// Width 6, Height 4. Center y=2.
const WAVY_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4' viewBox='0 0 6 4'%3E%3Cpath d='M0 2 Q1.5 0.5 3 2 T6 2' fill='none' stroke='%23f59e0b' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`;

export const DayCell: React.FC<DayCellProps> = ({ day }) => {
  if (!day || !day.isCurrentMonth || !day.date) {
    return <div className="h-9 w-full" aria-hidden="true" />;
  }

  // Generate unique ID for scrolling
  const cellId = `day-${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`;

  // Check if today
  const today = new Date();
  const isToday = day.date.getDate() === today.getDate() &&
                  day.date.getMonth() === today.getMonth() &&
                  day.date.getFullYear() === today.getFullYear();

  // --- Styles Config ---
  // Using h-9 (36px) for compact view
  let wrapperClasses = "group relative flex items-center justify-center w-full transition-all duration-1000 ease-out rounded-lg";
  let containerClasses = "relative h-9 w-full flex items-center justify-center text-sm transition-all duration-200 cursor-default select-none";
  let textClasses = "text-slate-600";
  let bgClasses = "bg-transparent"; 
  let borderClasses = "";

  const isMonday = day.date.getDay() === 1;
  const isSunday = day.date.getDay() === 0;
  const isBridge = day.dayType === DayType.BRIDGE;
  const isBridgeSequence = day.isBridgeSequence;

  if (day.isLongWeekendSequence) {
    // --- LONG WEEKEND SEQUENCE STYLING ---
    
    // Distinguish "Potential" (Bridge) sequences from "Natural" ones
    // Only background and border colors change based on sequence type
    const baseBg = isBridgeSequence ? "bg-orange-50/50" : "bg-indigo-50/60";
    const baseBorder = isBridgeSequence ? "border-orange-200" : "border-indigo-200";

    bgClasses = baseBg;
    
    // Top & Bottom borders
    // If bridge, we remove standard borders to use wavy lines
    if (isBridge) {
        borderClasses = "border-y-0";
    } else {
        borderClasses = `border-y ${baseBorder}`;
    }

    // --- LEFT BORDER LOGIC ---
    if (day.connectsToPrevWeek) {
      borderClasses += " border-l-0";
    } else if (day.isSequenceStart || isMonday) {
      borderClasses += ` border-l ${baseBorder} rounded-l-md`;
    } else {
      borderClasses += " border-l-0"; 
    }

    // --- RIGHT BORDER LOGIC ---
    if (day.connectsToNextWeek) {
      borderClasses += " border-r-0";
    } else if (day.isSequenceEnd || isSunday) {
      borderClasses += ` border-r ${baseBorder} rounded-r-md`;
    } else {
      borderClasses += " border-r-0";
    }

    // --- TEXT STYLES inside sequence ---
    if (day.dayType === DayType.HOLIDAY) {
      // Unified Holiday Color: Always use Indigo-700 for holidays, even inside orange bridge sequences
      textClasses = "text-indigo-700 font-bold";
    } else if (isBridge) {
      textClasses = "text-amber-600 font-bold";
      bgClasses = "bg-amber-50/60"; // Slightly darker/warmer for the bridge day itself
    } else {
      textClasses = isBridgeSequence ? "text-orange-900/70 font-medium" : "text-indigo-900/70 font-medium";
    }

  } else {
    // --- STANDARD DAY STYLING ---
    containerClasses += " my-0.5 mx-0.5 rounded-md h-8 w-[calc(100%-4px)]"; // Slightly smaller than wrapper
    
    if (day.dayType === DayType.SUNDAY || day.dayType === DayType.SATURDAY) {
      bgClasses = "bg-slate-50";
      textClasses = "text-slate-400";
    } else if (day.dayType === DayType.HOLIDAY) {
      bgClasses = "bg-indigo-50/30";
      textClasses = "text-indigo-600 font-bold";
      borderClasses = "border border-indigo-100";
    } else {
      bgClasses = "bg-white hover:bg-slate-50";
    }
  }

  // Highlight Today (High Priority Style)
  if (isToday) {
    // Add a strong ring/border to indicate today without breaking other background logic
    containerClasses += " ring-2 ring-indigo-500 ring-offset-1 font-extrabold z-30";
  }

  // Determine Tooltip Text
  const tooltipText = isToday 
    ? (day.holidayName ? `Dzisiaj: ${day.holidayName}` : "Dzisiaj") 
    : (day.holidayName || (isBridge ? "Warto wziąć wolne!" : null));

  return (
    <div id={cellId} className={wrapperClasses}>
      <div className={`${containerClasses} ${bgClasses} ${borderClasses} ${textClasses}`}>
        {/* Wavy Borders for Bridges */}
        {isBridge && day.isLongWeekendSequence && (
           <>
             {/* Top Wavy Line - Shifted up by 1px to center the wave on the border line */}
             <div 
               className="absolute -top-[1px] left-0 right-0 h-[4px] w-full z-20"
               style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }}
             />
             {/* Bottom Wavy Line - Shifted down by 1px */}
             <div 
               className="absolute -bottom-[1px] left-0 right-0 h-[4px] w-full z-20"
               style={{ backgroundImage: WAVY_BG, backgroundRepeat: 'repeat-x' }}
             />
           </>
        )}

        {/* Inner Content */}
        <span className="relative z-10">{day.date.getDate()}</span>
        
        {/* Holiday Indicator */}
        {day.dayType === DayType.HOLIDAY && (
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-rose-500 shadow-sm"></span>
        )}
      </div>

      {/* Custom Tooltip */}
      {tooltipText && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-50 whitespace-nowrap">
          <div className="bg-slate-800 text-white text-[10px] py-1 px-2 rounded shadow-lg relative">
            {tooltipText}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
          </div>
        </div>
      )}
    </div>
  );
};