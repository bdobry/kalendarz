
import { DayInfo, DayType } from '../types';

interface DayStyles {
  wrapper: string;
  container: string;
  text: string;
  bg: string;
  border: string;
  wavyLines: boolean;
  tooltipText: string | null;
  showContent: boolean;
  innerContainerClasses: string; // Combined container+bg+border+text
}

export const getDayStyles = (day: DayInfo, currentMonthIndex: number, isActiveSequence: boolean = false): DayStyles => {
  // Styles Config
  let wrapperClasses = "group relative flex items-center justify-center w-full transition-all duration-100 ease-out rounded-[5px]";
  let containerClasses = "relative h-8 w-full flex items-center justify-center text-sm transition-all duration-200 cursor-default select-none";
  let textClasses = "text-neutral-600";
  let bgClasses = "bg-transparent"; 
  let borderClasses = "";
  let wavyLines = false;
  let showContent = true;

  if (!day || !day.date) {
    return { 
        wrapper: "", container: "", text: "", bg: "", border: "", wavyLines: false, tooltipText: null, showContent: false, innerContainerClasses: "" 
    };
  }

  // Ghost Day Logic
  if (!day.isCurrentMonth) {
    const dayMonth = day.date.getMonth();
    // Check context (currentMonthIndex is 0-indexed)
    // 11 (Dec) -> dayMonth 0 (Jan)
    // 0 (Jan)  -> dayMonth 11 (Dec)
    const isYearBoundary = (currentMonthIndex === 11 && dayMonth === 0) || 
                           (currentMonthIndex === 0 && dayMonth === 11);

    if (isYearBoundary && day.isLongWeekendSequence) {
       containerClasses += " opacity-80"; 
    } else {
       showContent = false;
       return { 
        wrapper: "", container: "", text: "", bg: "", border: "", wavyLines: false, tooltipText: null, showContent: false, innerContainerClasses: "" 
       };
    }
  }

  const isToday = isDateToday(day.date);
  const isMonday = day.date.getDay() === 1;
  const isSunday = day.date.getDay() === 0;
  const isBridge = day.dayType === DayType.BRIDGE;
  const isBridgeSequence = day.isBridgeSequence;

  if (day.isLongWeekendSequence) {
    // --- LONG WEEKEND SEQUENCE STYLING ---
    // Fix: Increase height to match standard day (h-8 + my-0.5 + my-0.5 = 32+2+2 = 36px = h-9)
    // to prevent row misalignment between months
    containerClasses = containerClasses.replace('h-8', 'h-9'); 

    let baseBg = isActiveSequence ? "bg-brand-100" : "bg-transparent";
    
    // Restore weekend gray background if not active
    if (!isActiveSequence) {
        // Check for Saturday, Sunday, OR Holiday that falls on weekend
        const isDayWeekend = day.dayType === DayType.SATURDAY || day.dayType === DayType.SUNDAY;
        const isHolidayOnWeekend = day.dayType === DayType.HOLIDAY && (isSunday || day.date.getDay() === 6); // 6 is Saturday
        
        if (isDayWeekend || isHolidayOnWeekend) {
            baseBg = "bg-neutral-50";
        }
    }

    bgClasses = baseBg;
    const baseBorder = "border-brand-200";
    
    // Top & Bottom borders
    if (isBridge) {
        borderClasses = "border-y-0";
        wavyLines = true;
    } else {
        borderClasses = `border-y ${baseBorder}`;
    }

    // ... (rest of function) ...

  if (isToday) {
    containerClasses += " ring-2 ring-brand-500 ring-offset-1 font-extrabold z-30";
  }

  // Removed duplicate isToday block here

    // --- LEFT BORDER LOGIC ---
    if (day.connectsToPrevWeek) {
      borderClasses += " border-l-0";
    } else if (day.isSequenceStart || isMonday) {
      borderClasses += ` border-l ${baseBorder} rounded-l-[5px]`;
    } else {
      borderClasses += " border-l-0"; 
    }

    // --- RIGHT BORDER LOGIC ---
    if (day.connectsToNextWeek) {
      borderClasses += " border-r-0";
    } else if (day.isSequenceEnd || isSunday) {
      borderClasses += ` border-r ${baseBorder} rounded-r-[5px]`;
    } else {
      borderClasses += " border-r-0";
    }

    // --- TEXT STYLES ---
    if (day.dayType === DayType.HOLIDAY) {
      textClasses = "text-rose-600 font-bold";
    } else if (isBridge) {
      textClasses = isActiveSequence ? "text-amber-700 font-bold" : "text-neutral-600";
      bgClasses = isActiveSequence ? "bg-amber-50/80" : "bg-transparent";
    } else if (day.dayType === DayType.SATURDAY || day.dayType === DayType.SUNDAY) {
      textClasses = "text-neutral-400";
    } else {
      textClasses = "text-neutral-600";
    }

  } else {
    // --- STANDARD DAY STYLING ---
    containerClasses += " my-0.5 mx-0.5 rounded-[5px] h-8 w-[calc(100%-4px)]";
    
    if (day.dayType === DayType.SUNDAY || day.dayType === DayType.SATURDAY) {
      bgClasses = "bg-neutral-50";
      textClasses = "text-neutral-400";
    } else if (day.dayType === DayType.HOLIDAY) {
      // If holiday falls on weekend, use gray background
      const isWeekend = isSunday || day.date.getDay() === 6;
      bgClasses = isWeekend ? "bg-neutral-50" : "bg-transparent";
      
      textClasses = "text-rose-600 font-bold";
      borderClasses = "border border-brand-100";
    } else {
      bgClasses = "bg-white hover:bg-neutral-50 hover:shadow-xs";
    }
  }

  if (isToday) {
    containerClasses += " ring-2 ring-brand-500 ring-offset-1 font-extrabold z-30";
  }

  if (isToday) {
    containerClasses += " ring-2 ring-brand-500 ring-offset-1 font-extrabold z-30";
  }

  // Tooltip Logic
  let tooltipText = null;
  if (isToday) {
      tooltipText = day.holidayName ? `Dzisiaj: ${day.holidayName}` : "Dzisiaj";
  } else if (day.isLongWeekendSequence && day.sequenceInfo) {
      // Long Weekend Tooltip
      const startStr = day.sequenceInfo.start.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
      const endStr = day.sequenceInfo.end.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
      tooltipText = isActiveSequence ? `Długi Weekend: ${startStr} - ${endStr}` : null;
      
      // If holiday, maybe we want to show it too? 
      // User asked for "tooltip with info from when to when is long weekend".
      // We can append holiday name if present.
      if (day.holidayName) {
         tooltipText = isActiveSequence ? `${day.holidayName} (${startStr} - ${endStr})` : day.holidayName;
      }
      
      // If bridge, user likes "Warto wziąć wolne!"
      if (isBridge) {
          tooltipText = "Warto wziąć wolne!"; // Keep this specific one for bridges as it's a "CTA"
          if (isActiveSequence) {
             tooltipText += ` (${startStr} - ${endStr})`;
          }
      }
  } else {
      tooltipText = day.holidayName || null;
  }

  return {
    wrapper: wrapperClasses,
    container: containerClasses,
    text: textClasses,
    bg: bgClasses,
    border: borderClasses,
    wavyLines,
    tooltipText,
    showContent,
    innerContainerClasses: `${containerClasses} ${bgClasses} ${borderClasses} ${textClasses}`
  };
};

const isDateToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};
