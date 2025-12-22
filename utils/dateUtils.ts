import { DayType, DayInfo, MonthData, YearStats, GlobalStats, StatRange } from '../types';

// Polish Month Names
const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

// Calculate Easter Sunday for a given year (Meeus/Jones/Butcher's algorithm)
const getEasterDate = (year: number): Date => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
};

// Get fixed and movable holidays for Poland
const getPolishHolidays = (year: number): Map<string, string> => {
  const holidays = new Map<string, string>();

  const addHoliday = (month: number, day: number, name: string) => {
    // Format YYYY-MM-DD
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    holidays.set(key, name);
  };

  // Fixed Holidays
  addHoliday(0, 1, 'Nowy Rok');
  addHoliday(0, 6, 'Trzech Króli');
  addHoliday(4, 1, 'Święto Pracy');
  addHoliday(4, 3, 'Święto Konstytucji 3 Maja');
  addHoliday(7, 15, 'Wniebowzięcie NMP');
  addHoliday(10, 1, 'Wszystkich Świętych');
  addHoliday(10, 11, 'Święto Niepodległości');
  addHoliday(11, 25, 'Boże Narodzenie (1)');
  addHoliday(11, 26, 'Boże Narodzenie (2)');

  // New Holiday Law: Wigilia (Dec 24) is free from 2025 onwards
  if (year >= 2025) {
    addHoliday(11, 24, 'Wigilia Bożego Narodzenia');
  }

  // Movable Holidays
  const easter = getEasterDate(year);
  addHoliday(easter.getMonth(), easter.getDate(), 'Wielkanoc');

  const easterMonday = new Date(easter);
  easterMonday.setDate(easter.getDate() + 1);
  addHoliday(easterMonday.getMonth(), easterMonday.getDate(), 'Poniedziałek Wielkanocny');

  const corpusChristi = new Date(easter);
  corpusChristi.setDate(easter.getDate() + 60);
  addHoliday(corpusChristi.getMonth(), corpusChristi.getDate(), 'Boże Ciało');

  // Zielone Świątki (Pentecost)
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  addHoliday(pentecost.getMonth(), pentecost.getDate(), 'Zielone Świątki');

  return holidays;
};

const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const getFormattedDateRange = (start: Date, end: Date) => {
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  const startMonthShort = start.toLocaleDateString('pl-PL', { month: 'short' });
  const endMonthShort = end.toLocaleDateString('pl-PL', { month: 'short' });
  
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  return {
    startDay,
    endDay,
    startMonthShort,
    endMonthShort,
    startYear,
    endYear,
    isSameMonth: start.getMonth() === end.getMonth() && startYear === endYear,
    isSameYear: startYear === endYear
  };
};

export const generateCalendarData = (year: number): MonthData[] => {
  const holidays = getPolishHolidays(year);
  // 1. Generate Buffer Range (Dec 24 prev year -> Jan 7 next year)
  // This allows us to detect sequences crossing the year boundary
  const bufferStartDate = new Date(year - 1, 11, 24);
  const bufferEndDate = new Date(year + 1, 0, 7);

  // We need holidays for prev, curr, and next year
  const holidaysPrev = getPolishHolidays(year - 1);
  const holidaysCurr = getPolishHolidays(year);
  const holidaysNext = getPolishHolidays(year + 1);

  const getHolidayName = (d: Date) => {
    const y = d.getFullYear();
    const k = formatDateKey(d);
    if (y === year - 1) return holidaysPrev.get(k);
    if (y === year + 1) return holidaysNext.get(k);
    return holidaysCurr.get(k);
  };

  const allDaysBuffer: DayInfo[] = [];

  for (let d = new Date(bufferStartDate); d <= bufferEndDate; d.setDate(d.getDate() + 1)) {
    const current = new Date(d);
    const dayOfWeek = current.getDay();
    const holidayName = getHolidayName(current);

    let dayType = DayType.WORKDAY;
    if (holidayName) {
      dayType = DayType.HOLIDAY;
    } else if (dayOfWeek === 0) {
      dayType = DayType.SUNDAY;
    } else if (dayOfWeek === 6) {
      dayType = DayType.SATURDAY;
    }

    allDaysBuffer.push({
      date: current,
      dayType,
      holidayName,
      isCurrentMonth: current.getFullYear() === year, // Will be refined later for month view
      isLongWeekendSequence: false,
      isBridgeSequence: false,
    });
  }

  // 2. Detect Bridges (Mostki) on the BUFFERED array
  const isOffDay = (d: DayInfo) => d.dayType !== DayType.WORKDAY;

  allDaysBuffer.forEach((day, index) => {
    if (day.dayType === DayType.WORKDAY) {
      const prev = allDaysBuffer[index - 1];
      const next = allDaysBuffer[index + 1];

      // Simple 1-day bridge
      if (prev && next && isOffDay(prev) && isOffDay(next)) {
        day.dayType = DayType.BRIDGE;
      }
    }
  });

  // 3. Detect Long Weekend Sequences on the BUFFERED array
  let currentSequence: DayInfo[] = [];

  const flushSequence = () => {
    if (currentSequence.length >= 3) {
      const hasBridge = currentSequence.some(d => d.dayType === DayType.BRIDGE);
      
      const start = currentSequence[0].date;
      const end = currentSequence[currentSequence.length - 1].date;
      const id = `${formatDateKey(start)}_${formatDateKey(end)}`;
      const length = currentSequence.length;
      const sequenceInfo = { id, start, end, length };

      // Find the holiday name driving this sequence
      const holidayDay = currentSequence.find(d => d.dayType === DayType.HOLIDAY && d.holidayName);
      const linkedHolidayName = holidayDay ? holidayDay.holidayName : undefined;

      currentSequence.forEach(d => {
        d.isLongWeekendSequence = true;
        d.sequenceInfo = sequenceInfo;
        d.linkedHolidayName = linkedHolidayName;
        if (hasBridge) {
            d.isBridgeSequence = true;
        }
      });
    }
    currentSequence = [];
  };

  allDaysBuffer.forEach((day) => {
    if (isOffDay(day)) {
      currentSequence.push(day);
    } else {
      flushSequence();
    }
  });
  flushSequence();

  // Second pass: Identify Start/End and Cross-Week Connections on BUFFER
  for (let i = 0; i < allDaysBuffer.length; i++) {
    const day = allDaysBuffer[i];
    
    if (day.isLongWeekendSequence) {
      const prev = allDaysBuffer[i - 1];
      const next = allDaysBuffer[i + 1];

      // Basic start/end logic
      // We check if prev/next exist AND if they are part of the sequence.
      // Since we are running on buffer, we can see cross-year neighbors.
      if (!prev || !prev.isLongWeekendSequence) {
        day.isSequenceStart = true;
      }
      if (!next || !next.isLongWeekendSequence) {
        day.isSequenceEnd = true;
      }

      // Logic for wrapping borders (Sun -> Mon)
      const isSunday = day.date.getDay() === 0;
      const isMonday = day.date.getDay() === 1;

      // If today is Sunday and next day (Monday) is part of sequence, we connect to next week
      if (isSunday && next && next.isLongWeekendSequence) {
        day.connectsToNextWeek = true;
      }

      // If today is Monday and prev day (Sunday) is part of sequence, we connect from prev week
      if (isMonday && prev && prev.isLongWeekendSequence) {
        day.connectsToPrevWeek = true;
      }
    }
  }

  // 4. Extract only current year days
  // We filter even though we needed the buffer for calculation
  const fullYearDays = allDaysBuffer.filter(d => d.date.getFullYear() === year);

  // Group into Months for Display
  const months: MonthData[] = [];
  const dayMap = new Map<string, DayInfo>();
  allDaysBuffer.forEach(d => dayMap.set(formatDateKey(d.date), d));

  for (let m = 0; m < 12; m++) {
    // 1. Identify RELEVANT sequences for this month
    // A sequence is relevant if at least one day of it falls within the current month boundaries
    const relevantSequenceIds = new Set<string>();
    
    // We check all days that strictly belong to this month
    const monthDays = fullYearDays.filter(d => d.date.getMonth() === m);
    monthDays.forEach(d => {
        if (d.isLongWeekendSequence && d.sequenceInfo) {
            relevantSequenceIds.add(d.sequenceInfo.id);
        }
    });

    // Determine Grid Start (Monday)
    let startGridDate = new Date(year, m, 1);
    let startDayIdx = startGridDate.getDay() - 1;
    if (startDayIdx === -1) startDayIdx = 6;
    startGridDate.setDate(startGridDate.getDate() - startDayIdx);

    // Determine Grid End (Sunday)
    let endGridDate = new Date(year, m + 1, 0);
    let endDayIdx = endGridDate.getDay() - 1;
    if (endDayIdx === -1) endDayIdx = 6;
    endGridDate.setDate(endGridDate.getDate() + (6 - endDayIdx));

    // EXTEND BACKWARDS (Check if start connects to prev week)
    let checkingBackwards = true;
    let safety = 0;
    while (checkingBackwards && safety < 10) {
      safety++;
      const currentMonday = new Date(startGridDate);
      const prevSunday = new Date(currentMonday);
      prevSunday.setDate(prevSunday.getDate() - 1);

      const monInfo = dayMap.get(formatDateKey(currentMonday));
      const sunInfo = dayMap.get(formatDateKey(prevSunday));

      if (monInfo && sunInfo &&
          monInfo.isLongWeekendSequence && sunInfo.isLongWeekendSequence &&
          monInfo.sequenceInfo?.id === sunInfo.sequenceInfo?.id &&
          !monInfo.isSequenceStart) {
          
          startGridDate.setDate(startGridDate.getDate() - 7);
      } else {
          checkingBackwards = false;
      }
    }

    // EXTEND FORWARDS (Check if end connects to next week)
    let checkingForwards = true;
    safety = 0;
    while (checkingForwards && safety < 10) {
      safety++;
      const currentSunday = new Date(endGridDate);
      const nextMonday = new Date(currentSunday);
      nextMonday.setDate(nextMonday.getDate() + 1);

      const sunInfo = dayMap.get(formatDateKey(currentSunday));
      const monInfo = dayMap.get(formatDateKey(nextMonday));

      if (sunInfo && monInfo &&
          sunInfo.isLongWeekendSequence && monInfo.isLongWeekendSequence &&
          sunInfo.sequenceInfo?.id === monInfo.sequenceInfo?.id &&
          !sunInfo.isSequenceEnd) {
          
          endGridDate.setDate(endGridDate.getDate() + 7);
      } else {
          checkingForwards = false;
      }
    }

    const weeks: DayInfo[][] = [];
    let currentWeek: DayInfo[] = [];

    for (let d = new Date(startGridDate); d <= endGridDate; d.setDate(d.getDate() + 1)) {
       const key = formatDateKey(d);
       let originalInfo = dayMap.get(key);
       let dayInfo: DayInfo;

       if (originalInfo) {
         // Clone and update isCurrentMonth for this specific month view
         const isCurrent = (d.getMonth() === m && d.getFullYear() === year);
         dayInfo = { 
            ...originalInfo, 
            isCurrentMonth: isCurrent
         };

         // FILTER GHOST DAYS Logic:
         // 1. Check Relevance: Must belong to a sequence that touches the current month.
         // 2. Check Year Boundary: User specifically cares about Dec/Jan. 
         //    If we are not at a year boundary (Jan<->Dec), we hide sequence ghosts to avoid "too much" info.
         if (!isCurrent) {
             let shouldShow = false;
             
             if (dayInfo.isLongWeekendSequence && dayInfo.sequenceInfo) {
                 // Check 1: Is relevance established?
                 if (relevantSequenceIds.has(dayInfo.sequenceInfo.id)) {
                      // Check 2: Year Boundary (or just general Month Boundary?)
                      // User feedback suggests "Same for some Decembers" implies they dislike extra rows in general.
                      // Let's enforce Cross-Year constraint strictly for now as requested.
                      // Current month m (0-11). Ghost day month `d.getMonth()`.
                      // 0 (Jan) and 11 (Dec) are boundaries.
                      const ghostMonth = d.getMonth();
                      const isYearBoundary = (m === 0 && ghostMonth === 11) || (m === 11 && ghostMonth === 0);
                      
                      if (isYearBoundary) {
                          shouldShow = true;
                      }
                 }
             }

             if (!shouldShow) {
                 dayInfo.isLongWeekendSequence = false;
                 dayInfo.isBridgeSequence = false;
                 dayInfo.sequenceInfo = undefined;
             }
         }

       } else {
         // Fallback for days outside buffer
         const dow = d.getDay();
         const dayType = (dow === 0) ? DayType.SUNDAY : (dow === 6) ? DayType.SATURDAY : DayType.WORKDAY;
         dayInfo = {
            date: new Date(d),
            dayType,
            isCurrentMonth: false,
            isLongWeekendSequence: false,
            isBridgeSequence: false
         } as DayInfo;
       }

       currentWeek.push(dayInfo);
       if (currentWeek.length === 7) {
         weeks.push(currentWeek);
         currentWeek = [];
       }
    }

    // CLEANUP: Remove fully empty rows (weeks)
    // A row is empty if ALL days are !isCurrentMonth AND !isLongWeekendSequence
    // (Since we already stripped LWS from hidden ghosts above, this check is sufficient)
    const distinctWeeks: DayInfo[][] = [];
    weeks.forEach(week => {
        const hasVisibleContent = week.some(d => d.isCurrentMonth || d.isLongWeekendSequence);
        if (hasVisibleContent) {
            distinctWeeks.push(week);
        }
    });

    months.push({
      name: MONTH_NAMES[m],
      year,
      monthIndex: m,
      weeks: distinctWeeks
    });
  }

  return months;
};

// --- Statistics & Efficiency Logic ---

export const getYearStats = (months: MonthData[], redeemSaturdays: boolean = true): YearStats => {
  let totalHolidays = 0;
  let holidaysOnWorkdays = 0;
  let holidaysOnSaturdays = 0;
  let holidaysOnSundays = 0;
  let bridgeDaysCount = 0;
  
  const allHolidays: DayInfo[] = [];
  const longWeekendOpportunities: DayInfo[] = [];
  
  // Flatten data for analysis
  const allDays: DayInfo[] = [];
  months.forEach(m => m.weeks.forEach(w => w.forEach(d => {
    if (d.isCurrentMonth) allDays.push(d);
  })));

  // Iterate days
  for (let i = 0; i < allDays.length; i++) {
    const day = allDays[i];
    const dow = day.date.getDay(); // 0 = Sun, 6 = Sat

    if (day.dayType === DayType.HOLIDAY) {
      totalHolidays++;
      allHolidays.push(day);
      if (dow === 0) holidaysOnSundays++;
      else if (dow === 6) holidaysOnSaturdays++;
      else holidaysOnWorkdays++;
    }

    if (day.dayType === DayType.BRIDGE) {
      bridgeDaysCount++;
      longWeekendOpportunities.push(day);
    }
  }

  // --- 5. Extract Long Weekend Ranges (Natural) & Potential Ranges ---
  
  const longWeekendsList: { start: Date, end: Date, length: number }[] = [];
  const potentialWeekendsList: { start: Date, end: Date, length: number }[] = [];

  // Helper to scan for sequences
  let currentSeq: DayInfo[] = [];

  // 5a. Natural Long Weekends (Using sequenceInfo form buffer)
  const sequencesMap = new Map<string, { start: Date, end: Date, length: number }>();

  // Iterate allDays and collect unique sequences
  allDays.forEach(d => {
    if ((d.dayType === DayType.SATURDAY || d.dayType === DayType.SUNDAY || d.dayType === DayType.HOLIDAY) && d.sequenceInfo && d.isLongWeekendSequence) {
        // We only care about sequences that strictly have NO bridges?
        // Original logic: "Natural Long Weekends (ignoring bridges, just Sat/Sun/Holiday)"
        // But the new calculation in generateCalendarData already sets `sequenceInfo` for ANY sequence >= 3.
        // And it sets `isBridgeSequence` if it has a bridge.
        if (!d.isBridgeSequence) {
             sequencesMap.set(d.sequenceInfo.id, {
                 start: d.sequenceInfo.start,
                 end: d.sequenceInfo.end,
                 length: d.sequenceInfo.length
             });
        }
    }
  });

  longWeekendsList.push(...Array.from(sequencesMap.values()).sort((a,b) => a.start.getTime() - b.start.getTime()));

  // 5b. Potential Long Weekends (Sequences containing bridges)
  // We can reuse the logic from generateCalendarData but we need it here for the stats list.
  // Or better: scan for sequences that include BRIDGE type or are adjacent to existing bridge logic?
  // Actually, 'isLongWeekendSequence' and 'isBridgeSequence' are already marked on days!
  // Let's use those flags if possible, or re-calculate.
  // The 'allDays' array comes from 'months', which comes from 'generateCalendarData' where these flags are set.
  // Let's rebuild the sequences based on `isBridgeSequence`.

  currentSeq = [];
  for (let i = 0; i < allDays.length; i++) {
    const d = allDays[i];
    // We want sequences that contain at least one bridge (potential)
    // In generateCalendarData, we marked `isLongWeekendSequence` and `isBridgeSequence`.
    // However, `isBridgeSequence` is true for ALL days in a sequence that has a bridge.
    // So we just need to group consecutive days where `isBridgeSequence` is true.
    
    if (d.isBridgeSequence) {
        currentSeq.push(d);
    } else {
        if (currentSeq.length > 0) {
            potentialWeekendsList.push({
                start: currentSeq[0].date,
                end: currentSeq[currentSeq.length - 1].date,
                length: currentSeq.length
            });
        }
        currentSeq = [];
    }
  }
  if (currentSeq.length > 0) {
      potentialWeekendsList.push({
          start: currentSeq[0].date,
          end: currentSeq[currentSeq.length - 1].date,
          length: currentSeq.length
      });
  }


  // Algorithm for Efficiency Class (A-G)
  let score = (holidaysOnWorkdays * 6) + (longWeekendsList.length * 4) + (bridgeDaysCount * 3) - (holidaysOnSundays * 3);
  
  if (redeemSaturdays) {
    score += 0;
  } else {
    score -= (holidaysOnSaturdays * 1);
  }
  
  let efficiencyClass = 'D';
  if (score >= 79) efficiencyClass = 'A';
  else if (score >= 73) efficiencyClass = 'B';
  else if (score >= 68) efficiencyClass = 'C';
  else if (score >= 63) efficiencyClass = 'D';
  else if (score >= 58) efficiencyClass = 'E';
  else if (score >= 53) efficiencyClass = 'F';
  else efficiencyClass = 'G';

  // Effective days count
  const effectiveDays = holidaysOnWorkdays + (redeemSaturdays ? holidaysOnSaturdays : 0);
  
  // Lost days count
  const lostDays = holidaysOnSundays + (redeemSaturdays ? 0 : holidaysOnSaturdays);

  return {
    totalHolidays,
    holidaysOnWorkdays,
    holidaysOnSaturdays,
    holidaysOnSundays,
    longWeekendsCount: longWeekendsList.length, // Use calculated list length
    bridgeDaysCount,
    efficiencyScore: score,
    efficiencyClass,
    longWeekendOpportunities,
    allHolidays,
    effectiveDays,
    lostDays,
    longWeekendsList,
    potentialWeekendsList
  };
};

export const getGlobalStatsRange = (redeemSaturdays: boolean): GlobalStats => {
  const startYear = 1991;
  const endYear = 2099;
  
  const statsList: YearStats[] = [];

  for (let y = startYear; y <= endYear; y++) {
    const data = generateCalendarData(y);
    statsList.push(getYearStats(data, redeemSaturdays));
  }

  const calculateRange = (key: keyof YearStats): StatRange => {
    const values = statsList.map(s => s[key] as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = parseFloat((sum / values.length).toFixed(1));
    return { min, max, avg };
  };

  return {
    totalHolidays: calculateRange('totalHolidays'),
    holidaysOnWorkdays: calculateRange('holidaysOnWorkdays'),
    holidaysOnSaturdays: calculateRange('holidaysOnSaturdays'),
    holidaysOnSundays: calculateRange('holidaysOnSundays'),
    longWeekendsCount: calculateRange('longWeekendsCount'),
    bridgeDaysCount: calculateRange('bridgeDaysCount'),
    effectiveDays: calculateRange('effectiveDays'),
    lostDays: calculateRange('lostDays'),
  };
};
