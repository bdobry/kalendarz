
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
// --- Holiday Stats Analysis for Calendar Hover ---

export interface HolidayCalendarStats {
    layout: string;
    isOptimal: boolean;
    frequencyPercent: number; // Raw %
    percentile: number; // "Better than XX%"
    frequencyText: string; // "Raz na X lat"
    nextOccurrenceYear: number | null;
    recommendationType: 'SAME_LAYOUT' | 'BETTER_LAYOUT' | 'STANDARD';
    isStandard: boolean;
    standardDescription?: string; // Specific text for standard holidays
    holidayGroupName?: string;
    rating: 'OPTIMAL' | 'GOOD' | 'AVERAGE' | 'BAD';
}



const isLeap = (year: number) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
const getDayName = (dow: number) => ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'][dow];

// Tier Scoring System
// 10 = Optimal (Mon/Fri)
// 8  = Bridgeable (Tue/Thu)
// 5  = Mid (Wed)
// 2  = Bad (Sat/Sun)
const getDayScore = (dow: number): number => {
    if (dow === 1 || dow === 5) return 10; // Mon, Fri
    if (dow === 2 || dow === 4) return 8;  // Tue, Thu
    if (dow === 3) return 5;               // Wed
    return 2;                              // Sat, Sun
};

const getMajowkaStats = (year: number) => {
    const d = new Date(year, 4, 1); // May 1
    const dow = d.getDay();
    
    // Layouts
    const layouts = [
        "nd-pn-wt", // 0
        "pn-wt-śr", // 1
        "wt-śr-czw", // 2
        "śr-czw-pt", // 3
        "czw-pt-sb", // 4
        "pt-sb-nd", // 5
        "sb-nd-pn"  // 6
    ];

    // Explicit scoring for Majowka
    let score = 2; 
    // Mon (1), Wed (3) => Optimal (10)
    // Tue (2), Thu (4) => Bridge (8)
    // Fri (5), Sat (6), Sun (0) => Bad (2)

    if (dow === 1 || dow === 3) score = 10;
    else if (dow === 2 || dow === 4) score = 8;
    
    return { layout: layouts[dow], score, key: dow };
};

const getXmasStats = (year: number) => {
    const d = new Date(year, 11, 25); // Dec 25
    const dow = d.getDay();
    
    // Xmas specifics
    let score = 2;
    // User requires: 
    // Mon-Tue-Wed (Dec 25=Tue) => Optimal (10)
    // Wed-Thu-Fri (Dec 25=Thu) => Optimal (10)
    // Thu-Fri-Sat (Dec 25=Fri) => Bad/Not Ideal (User complained about 2026) => Score 2 or 5.
    
    if (dow === 2 || dow === 4) score = 10; // Tue, Thu (Optimal)
    else if (dow === 1 || dow === 5) score = 5; // Mon, Fri (Sub-optimal but better than weekend?)
    else score = 2; // Sat, Sun, Wed(3)?

    // Fallback logic
    if (dow === 2 || dow === 4) score = 10;
    else if (dow === 1 || dow === 3 || dow === 5) score = 5;
    else score = 2;

    return { 
        layout: getDayName(dow), 
        score, 
        key: dow 
    };
};

const getFixedHolidayStats = (day: number, month: number, year: number) => {
    const d = new Date(year, month, day);
    const dow = d.getDay();
    
    return { 
        layout: getDayName(dow), 
        score: getDayScore(dow), 
        key: dow 
    };
};

export const getHolidayStats = (holidayName: string, year: number): HolidayCalendarStats | null => {
    // 1. Identify Holiday Type
    const name = holidayName.toLowerCase();
    
    let type: 'MAJOWKA' | 'XMAS' | 'FIXED' | 'STANDARD' | null = null;
    let fixedDay = 0; 
    let fixedMonth = 0; // 0-indexed
    let groupName = holidayName; // Default to the provided name

    if (name.includes('wielkanoc') || name.includes('ciało') || name.includes('zielone')) {
        let standardDescription = "To standardowa sytuacja co roku.";
        if (name.includes('wielkanoc')) {
            standardDescription = "Zawsze w niedzielę i poniedziałek.";
            groupName = "Wielkanoc";
        }
        else if (name.includes('ciało')) {
            standardDescription = "Co roku wypada w czwartek.";
            groupName = "Boże Ciało";
        }
        else if (name.includes('zielone')) {
            standardDescription = "Co roku wypadają w niedzielę.";
            groupName = "Zielone Świątki";
        }

        return {
            layout: "Standardowy",
            isOptimal: true,
            frequencyPercent: 100,
            percentile: 0,
            frequencyText: "Co roku",
            nextOccurrenceYear: null,
            recommendationType: 'STANDARD',
            isStandard: true,
            standardDescription,
            holidayGroupName: groupName,
            rating: 'OPTIMAL'
        };
    }

    if (name.includes('majówka') || name.includes('pracy') || name.includes('3 maja')) {
        type = 'MAJOWKA';
        groupName = "Majówka";
    }
    else if (name.includes('narodzenie') || name.includes('wigilia')) {
        type = 'XMAS';
        groupName = "Boże Narodzenie";
    }
    else if (name.includes('niepodległości')) { type = 'FIXED'; fixedDay = 11; fixedMonth = 10; groupName = "Święto Niepodległości"; }
    else if (name.includes('nowy rok')) { type = 'FIXED'; fixedDay = 1; fixedMonth = 0; groupName = "Nowy Rok"; }
    else if (name.includes('trzech króli')) { type = 'FIXED'; fixedDay = 6; fixedMonth = 0; groupName = "Trzech Króli"; }
    else if (name.includes('wszystkich świętych')) { type = 'FIXED'; fixedDay = 1; fixedMonth = 10; groupName = "Wszystkich Świętych"; }
    else if (name.includes('wniebowzięcie') || name.includes('sierpniówka') || name.includes('wojska')) { 
        type = 'FIXED'; 
        fixedDay = 15; 
        fixedMonth = 7; 
        groupName = "Sierpniówka"; // User explicitly requested "Sierpniówka"
    }
    
    if (!type) {
         // Fallback if not identified but valid holiday?
         // Just use the name as groupName
         return null; 
    }

    // 2. Simulation
    const START_YEAR = 2024;
    const END_YEAR = 2100;
    const totalYears = END_YEAR - START_YEAR + 1;
    
    let currentKey: any = null;
    let currentScore = 0;
    let currentLayout = "";
    
    const allScores: number[] = [];
    let nextSameTierYear = null;
    let nextOptimalYear = null;

    const calc = (y: number) => {
        if (type === 'MAJOWKA') return getMajowkaStats(y);
        if (type === 'XMAS') return getXmasStats(y);
        return getFixedHolidayStats(fixedDay, fixedMonth, y);
    };

    const currentRes = calc(year);
    currentKey = currentRes.key;
    currentScore = currentRes.score;
    currentLayout = currentRes.layout;

    // Loop
    for (let y = START_YEAR; y <= END_YEAR; y++) {
        const res = calc(y);
        const sc = res.score;
        allScores.push(sc);

        if (y > year) {
            if (!nextOptimalYear && sc === 10) {
                nextOptimalYear = y;
            }
            if (!nextSameTierYear && sc === currentScore) {
                nextSameTierYear = y;
            }
        }
    }

    const isOptimal = currentScore === 10;

    // Determine Rating
    let rating: HolidayCalendarStats['rating'] = 'BAD';
    if (currentScore >= 10) rating = 'OPTIMAL';
    else if (currentScore >= 8) rating = 'GOOD';
    else if (currentScore >= 5) rating = 'AVERAGE';
    else rating = 'BAD';

    // 3. Stats Calculation
    const worseThanCount = allScores.filter(s => s < currentScore).length;
    const equalCount = allScores.filter(s => s === currentScore).length;
    
    const freqVal = totalYears / equalCount;
    let frequencyText = "";
    if (freqVal <= 1.2) frequencyText = "Prawie co roku";
    else if (freqVal >= 10) frequencyText = `Bardzo rzadko`;
    else frequencyText = `Co ok. ${freqVal.toFixed(1).replace('.0', '')} lata`;

    const percentile = Math.round(((worseThanCount + (equalCount * 0.5)) / totalYears) * 100);

    return {
        layout: currentLayout,
        isOptimal,
        frequencyPercent: Math.round((equalCount/totalYears)*100),
        percentile,
        frequencyText,
        nextOccurrenceYear: isOptimal ? nextSameTierYear : nextOptimalYear,
        recommendationType: isOptimal ? 'SAME_LAYOUT' : 'BETTER_LAYOUT',
        isStandard: false,
        holidayGroupName: groupName,
        rating
    };
};
