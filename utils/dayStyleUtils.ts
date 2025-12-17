
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

export const getDayStyles = (day: DayInfo, currentMonthIndex: number): DayStyles => {
  // Styles Config
  let wrapperClasses = "group relative flex items-center justify-center w-full transition-all duration-1000 ease-out rounded-[5px]";
  let containerClasses = "relative h-9 w-full flex items-center justify-center text-sm transition-all duration-200 cursor-default select-none";
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
    const baseBg = "bg-brand-50";
    const baseBorder = "border-brand-100";

    bgClasses = baseBg;
    
    // Top & Bottom borders
    if (isBridge) {
        borderClasses = "border-y-0";
        wavyLines = true;
    } else {
        borderClasses = `border-y ${baseBorder}`;
    }

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
      textClasses = "text-brand-700 font-bold";
    } else if (isBridge) {
      textClasses = "text-amber-700 font-bold";
      bgClasses = "bg-amber-50/80";
    } else {
      textClasses = "text-brand-900/80 font-medium";
    }

  } else {
    // --- STANDARD DAY STYLING ---
    containerClasses += " my-0.5 mx-0.5 rounded-[5px] h-8 w-[calc(100%-4px)]";
    
    if (day.dayType === DayType.SUNDAY || day.dayType === DayType.SATURDAY) {
      bgClasses = "bg-neutral-50";
      textClasses = "text-neutral-400";
    } else if (day.dayType === DayType.HOLIDAY) {
      bgClasses = "bg-brand-50/40";
      textClasses = "text-brand-600 font-bold";
      borderClasses = "border border-brand-100";
    } else {
      bgClasses = "bg-white hover:bg-neutral-50 hover:shadow-xs";
    }
  }

  if (isToday) {
    containerClasses += " ring-2 ring-brand-500 ring-offset-1 font-extrabold z-30";
  }

  const tooltipText = isToday 
    ? (day.holidayName ? `Dzisiaj: ${day.holidayName}` : "Dzisiaj") 
    : (day.holidayName || (isBridge ? "Warto wziąć wolne!" : null));

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
