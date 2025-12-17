
import { DayInfo, DayType, MonthData } from '../types';
import { generateCalendarData } from './dateUtils';

export interface VacationOpportunity {
  id: string;
  startDate: Date;
  endDate: Date;
  daysToTake: number; // Cost (count of workdays)
  vacationDays: Date[]; // Specific days to take off
  freeDays: number; // Gain (total length)
  efficiency: number; // Gain / Cost
  description: string; // e.g. "Majówka 2025"
  periodName?: string; // e.g. "Boże Narodzenie", "Majówka" - used for stats grouping
  monthIndex: number; // For grouping/sorting
}

export const analyzeVacationStrategies = (year: number): VacationOpportunity[] => {
  const monthData = generateCalendarData(year);

  const determinePeriodName = (start: Date, end: Date, allDays: DayInfo[], startIdx: number, endIdx: number): string => {
    // Collect all holidays in this range
    const holidaysInRange = new Set<string>();
    
    // We scan the range provided
    for (let k = startIdx; k <= endIdx; k++) {
        const d = allDays[k];
        if (d.dayType === DayType.HOLIDAY && d.holidayName) {
            holidaysInRange.add(d.holidayName);
        }
    }

    if (holidaysInRange.size === 0) {
        // Fallback to month name if no holidays
        return start.toLocaleString('pl-PL', { month: 'long' });
    }

    // Specific logic for popular periods
    const holidays = Array.from(holidaysInRange);
    
    // Check for specific periods
    const hasXmas = holidays.some(h => h.includes('Boże Narodzenie') || h.includes('Nowy Rok') || h.includes('Trzech Króli'));
    if (hasXmas) {
       if (holidays.some(h => h.includes('Boże Narodzenie'))) return "Boże Narodzenie";
       if (holidays.some(h => h.includes('Nowy Rok'))) return "Sylwester / Nowy Rok";
       if (holidays.some(h => h.includes('Trzech Króli'))) return "Trzech Króli";
    }

    // Majówka: ONLY if it includes May 1st or May 3rd
    if (holidays.some(h => h.includes('Święto Pracy') || h.includes('3 Maja'))) return "Majówka";
    
    if (holidays.some(h => h.includes('Wielkanoc'))) return "Wielkanoc";
    if (holidays.some(h => h.includes('Boże Ciało'))) return "Boże Ciało";
    if (holidays.some(h => h.includes('Wniebowzięcie'))) return "Sierpniówka";
    if (holidays.some(h => h.includes('Wszystkich') || h.includes('Niepodległości'))) {
        if (holidays.some(h => h.includes('Wszystkich'))) return "Wszystkich Świętych";
        return "Święto Niepodległości";
    }

    return holidays[0]; // Default to first holiday name
  };
  
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
  // CRITICAL: DayType.BRIDGE is a Workday for Cost purposes.
  
  const isFree = (d: DayInfo) => d.dayType !== DayType.WORKDAY && d.dayType !== DayType.BRIDGE;
  
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
                  // Calculate total length in days, rounding to nearest integer to handle DST shifts
                  // (e.g. 23 hours should count as 1 day, 25 hours as 1 day when calculating calendar span)
                  const diffTime = Math.abs(endDay.date.getTime() - startDay.date.getTime());
                  const totalLength = Math.round(diffTime / (1000 * 3600 * 24)) + 1;
                  
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
                     periodName: determinePeriodName(startDay.date, endDay.date, sortedDays, rangeStartIdx, rangeEndIdx),
                     monthIndex: vacationDays.length > 0 ? vacationDays[0].getMonth() : startDay.date.getMonth()
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
  // Let's filter efficiency >= 2.0 to reduce clutter (e.g. 1.9s).
  
  // Also, user specifically said "2 or more days".
  // A standard week (5 days off -> 9 days free) is efficiency 1.8.
  
  let validOpportunities = opportunities.filter(o => o.efficiency >= 2.0); // Strictly better/equal 2.0 (1 day off for 2 days free is 2.0? No cost 1 free 2 is 2.0. Cost 2 Free 4 is 2.0)

  
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

export interface StrategyStatsAnalysis {
    stats: any;
    isRare: boolean;
    isBestPossible: boolean;
    isStandardSequence: boolean;
    frequencyText: string;
    nextOccurrence: number | null;
    periodName: string;
    percentile: number;
    rating: 'RARE' | 'BEST' | 'VERY_GOOD' | 'GOOD' | 'AVERAGE';
}

export const analyzeStrategyStats = (strategy: VacationOpportunity, statsData: any): StrategyStatsAnalysis | null => {
    // Stats Calculation
    const periodName = strategy.periodName || ''; 
    const key = periodName || strategy.description.replace('Urlop w miesiącu ', '');
    const stats = statsData[key];
    
    if (!stats) return null;

    // Combination Key check
    const comboKey = `${strategy.efficiency.toFixed(2)}_${strategy.freeDays}`;
    const combination = stats.combinations?.[comboKey]; // Safe access if old JSON (should be new)
    
    const isBestPossible = strategy.efficiency >= stats.maxEfficiency;

    let frequencyText = "";
    let nextOccurrence = null;
    let isRare = false;
    let isStandardSequence = false;
    let percentile = 0;
    
    if (combination) {
            // Frequency
            const totalYears = 2100 - 2024; // Range of simulation
            const freq = Math.round(totalYears / combination.count);
            
            if (freq >= 20) frequencyText = `Bardzo rzadko (raz na ${freq} lat)`;
            else if (freq >= 5) frequencyText = `Raz na ${freq} lat`;
            else if (freq <= 1) frequencyText = `Co roku`;
            else frequencyText = `Co ok. ${freq} lata`;

        // Next Opportunity
        const currentYearStr = strategy.startDate.getFullYear();
        const endYearStr = strategy.endDate.getFullYear();
        // Ensure we look for a year strictly greater than the *end* of the current strategy
        // This avoids showing "2047" as next occurrence when the current strategy ends in Jan 2047.
        const baselineYear = Math.max(currentYearStr, endYearStr);
        const nextYear = combination.years.find((y: number) => y > baselineYear);
        if (nextYear) nextOccurrence = nextYear;
        
        // Detect "Standard" sequences (Constant Efficiency OR Frequent Best Possible)
        const minEff = Math.min(...stats.efficiencies);
        const maxEff = Math.max(...stats.efficiencies);
        const isStrictlyConstant = minEff === maxEff;
        const isFrequent = freq <= 1; // Happens every year
        
        // It is "Standard" if:
        // 1. Strictly constant (always same efficiency, e.g. some fixed holidays)
        // 2. OR It is the "Best Possible" for this period AND it happens effectively every year.
        isStandardSequence = isStrictlyConstant || (isBestPossible && isFrequent);

            // Rarity based on Frequency
            const betterThan = stats.efficiencies.filter((e: number) => e < strategy.efficiency).length;
            const equalTo = stats.efficiencies.filter((e: number) => Math.abs(e - strategy.efficiency) < 0.001).length;
            
            // "Fair Percentile" - includes half of the ties
            // This is better for discrete distributions where many values are identical (e.g. 2.0 efficiency).
            // It puts the "Standard" (Median) value at ~50% instead of at the bottom of the pile.
            percentile = Math.round(((betterThan + (equalTo * 0.5)) / stats.samples) * 100);
            
            // If it's a standard/common sequence, we prevent "Rare" flame even if percentile is high (which happens if distribution is skewed)
            // AND we require it to be reasonably close to the best possible efficiency (>= 85% of max) to be considered a "Rare Gem".
            // AND we require it to occur NOT frequently (at least every 4 years on average). "Every 2 years" is not rare.
            const isQualityRare = strategy.efficiency >= (stats.maxEfficiency * 0.85);
            const isTrulyRareFreq = freq >= 4; 
            isRare = !isStandardSequence && isQualityRare && isTrulyRareFreq && (percentile > 80 || (isBestPossible && stats.efficiencies.some((e: number) => e < strategy.efficiency)));
    }

    // Determine Rating Label
    let rating: StrategyStatsAnalysis['rating'] = 'AVERAGE';
    if (isStandardSequence) rating = 'GOOD'; 
    else if (isRare) rating = 'RARE';
    else if (isBestPossible) rating = 'BEST';
    else if (percentile >= 70) rating = 'VERY_GOOD';
    else if (percentile >= 40) rating = 'GOOD';
    else rating = 'AVERAGE';

    return { stats, isRare, isBestPossible, isStandardSequence, frequencyText, nextOccurrence, periodName, percentile, rating };
};
