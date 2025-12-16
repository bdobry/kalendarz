
import { DayInfo, DayType, MonthData } from '../types';
import { generateCalendarData } from './dateUtils';

interface VacationOpportunity {
  id: string;
  startDate: Date;
  endDate: Date;
  daysToTake: number; // Cost (count of workdays)
  vacationDays: Date[]; // Specific days to take off
  freeDays: number; // Gain (total length)
  efficiency: number; // Gain / Cost
  description: string; // e.g. "Majówka 2025"
  monthIndex: number; // For grouping/sorting
}

export const analyzeVacationStrategies = (year: number): VacationOpportunity[] => {
  const monthData = generateCalendarData(year);
  
  // 1. Flatten the calendar into a linear array of days
  // We need to be careful with overlaps between months in the MonthData structure, 
  // but generateCalendarData returns checks `isCurrentMonth`.
  // Actually, generateCalendarData returns full weeks, so there are duplicates (ghosts).
  // We should just reconstruct a clean linear timeline for the whole year.
  // The easiest way is to re-generate the daily timeline from Jan 1 to Dec 31
  // using the same logic as dateUtils but linearized.
  // OR, we can just extract `isCurrentMonth` days from `monthData` and then stitch them.
  // BUT we need context of adjacent years (Jan 1st next year etc) for continuous blocks at edges.
  // `generateCalendarData` has an internal buffer but doesn't expose it. 
  // It returns months 0-11.
  // Let's iterate month 0-11, extract `isCurrentMonth` days.
  // Then padding: we might need a few days from next year to calculate the full extent of a break 
  // spanning Dec-Jan.
  // Ideally, `generateCalendarData` logic should be accessible. 
  // For now, I'll rely on extracting `isCurrentMonth` days and adding a small buffer manually 
  // if needed, or just trusting the month view's "ghosts" for the ends?
  // No, easiest is to just use `generateCalendarData` and extract all distinct days.
  
  const allDaysMap = new Map<string, DayInfo>();
  
  monthData.forEach(month => {
      month.weeks.forEach(week => {
          week.forEach(day => {
              const key = day.date.toISOString().split('T')[0];
              // We prefer the 'isCurrentMonth' version if available, otherwise any
              if (!allDaysMap.has(key) || day.isCurrentMonth) {
                  allDaysMap.set(key, day);
              }
          });
      });
  });

  // Convert to sorted array
  let sortedDays = Array.from(allDaysMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());

  // We need to ensure we have a continuous stream.
  // Using the map ensures uniqueness.
  // The range might technically miss a day if `generateCalendarData` has gaps (unlikely).
  // But strictly `generateCalendarData` is for display.
  // Let's assume it covers the full year + some buffer.
  
  // Filter to ensure we focus on the relevant year mainly, 
  // but we DO want to "look ahead" into Jan of next year if a break extends there.
  // `dateUtils` buffer is Dec 24 (prev) to Jan 7 (next).
  // So we definitely have the edges covered.

  // 2. Identify Free Segments (non-workdays)
  // We treat saturdays/sundays/holidays as "Free".
  // Bridges are technically Workdays unless we decided to take them.
  // We are LOOKING for bridges/sequences.
  
  const isFree = (d: DayInfo) => d.dayType !== DayType.WORKDAY;
  
  // Create blocks of Free days.
  // Segments: { startIdx, endIdx, days[] }
  const freeSegments: { startIdx: number, endIdx: number }[] = [];
  
  let currentStart = -1;
  
  for (let i = 0; i < sortedDays.length; i++) {
      if (isFree(sortedDays[i])) {
          if (currentStart === -1) currentStart = i;
      } else {
          if (currentStart !== -1) {
              freeSegments.push({ startIdx: currentStart, endIdx: i - 1 });
              currentStart = -1;
          }
      }
  }
  if (currentStart !== -1) {
      freeSegments.push({ startIdx: currentStart, endIdx: sortedDays.length - 1 });
  }
  
  const opportunities: VacationOpportunity[] = [];
  
  // 3. Find gaps between segments that are "Fillable"
  // We look at freeSegments[i] and freeSegments[j].
  // All days between them (indices freeSegments[i].endIdx + 1 ... freeSegments[j].startIdx - 1) 
  // must be WORKDAYS (since we broke segments on Workday).
  // We calculate the number of workdays.
  
  // We iterate through all pairs (i, j)
  // Constraint: number of workdays <= MaxCost (e.g. 10)
  // Constraint: number of workdays >= MinCost (e.g. 2, per user req)
  
  const MIN_COST = 2;
  const MAX_COST = 12; // Allow for roughly 2 weeks
  
  for (let i = 0; i < freeSegments.length; i++) {
      let daysTakenTotal = 0;
      
      // Look ahead to subsequent segments
      for (let j = i + 1; j < freeSegments.length; j++) {
          // Calculate gap between segment[j-1] and segment[j]
          const gapStart = freeSegments[j-1].endIdx + 1;
          const gapEnd = freeSegments[j].startIdx - 1;
          const gapLength = (gapEnd - gapStart) + 1;
          
          daysTakenTotal += gapLength;
          
          if (daysTakenTotal > MAX_COST) break;
          
          if (daysTakenTotal >= MIN_COST) {
              // Valid Opportunity found!
              // Range starts at start of Segment[i]
              // Ends at end of Segment[j] 
              
              const rangeStartIdx = freeSegments[i].startIdx;
              const rangeEndIdx = freeSegments[j].endIdx;
              
              const startDay = sortedDays[rangeStartIdx];
              const endDay = sortedDays[rangeEndIdx];
              
              // Filter out opportunities that are mostly outside the main year?
              // User cares about "Current Year" planning.
              // If the VACATION days (gaps) are in the current year, it counts.
              // Check if at least one workday is in the current year.
              let validYear = false;
              // Collect workdays (the days we need to take off)
              const vacationDays: Date[] = [];
              // We need to re-scan gaps from i to j to collect specific dates
              for (let k = i; k < j; k++) {
                  // Gap between k and k+1
                  for (let d = freeSegments[k].endIdx + 1; d < freeSegments[k+1].startIdx; d++) {
                      const wDay = sortedDays[d];
                      vacationDays.push(wDay.date);
                      if (wDay.date.getFullYear() === year) validYear = true;
                  }
              }
              
              if (validYear) {
                  const totalLength = (endDay.date.getTime() - startDay.date.getTime()) / (1000 * 3600 * 24) + 1;
                  const score = totalLength / daysTakenTotal;
                  
                  const monthName = startDay.date.toLocaleString('pl-PL', { month: 'long' });
                  
                  opportunities.push({
                      id: `${startDay.date.toISOString()}_${endDay.date.toISOString()}`,
                      startDate: startDay.date,
                      endDate: endDay.date,
                      daysToTake: daysTakenTotal,
                      vacationDays, // Add the specific days
                      freeDays: Math.round(totalLength),
                      efficiency: parseFloat(score.toFixed(2)),
                      description: `Urlop w miesiącu ${monthName}`,
                      monthIndex: startDay.date.getMonth()
                  });
              }
          }
      }
  }
  
  // Post-processing
  // Filter out low efficiency? 
  // Normal weekend = 2 days free / 0 work.
  // Normal week = 9 days free / 5 work = 1.8.
  // We want strictly better than 1.8 or just "Good" ones?
  // User asked for "Najbardziej korzystne".
  // Let's filter efficiency > 1.8 (better than normal week).
  // Or just keep top X.
  
  // Also, user specifically said "2 or more days".
  // A standard week (5 days off -> 9 days free) is efficiency 1.8.
  // So anything ABOVE 1.8 is a "Deal".
  // Anything EQUAL to 1.8 is "Standard".
  // Anything below is "Bad".
  
  let validOpportunities = opportunities.filter(o => o.efficiency > 1.8); // Strictly better than standard week
  
  // Sort by Efficiency Desc, then Length Desc
  validOpportunities.sort((a, b) => {
      if (Math.abs(b.efficiency - a.efficiency) > 0.1) {
          return b.efficiency - a.efficiency;
      }
      return b.freeDays - a.freeDays;
  });
  
  // Deduplicate overlaps?
  // If we have "Take Mon-Tue" (Eff 3.0) and "Take Mon-Wed" (Eff 2.5).
  // If the user wants optimal, they might want to see the 3.0.
  // But maybe the 2.5 gives a much longer break?
  // We Keep both.
  
  // Final constraint: Limit the number of results to keep the UI clean?
  // Or group them?
  
  return validOpportunities;
};
