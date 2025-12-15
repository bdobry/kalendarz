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

export const generateCalendarData = (year: number): MonthData[] => {
  const holidays = getPolishHolidays(year);
  const fullYearDays: DayInfo[] = [];

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const current = new Date(d);
    const dayOfWeek = current.getDay(); // 0 = Sun, 6 = Sat
    const key = formatDateKey(current);
    const holidayName = holidays.get(key);

    let dayType = DayType.WORKDAY;
    if (holidayName) {
      dayType = DayType.HOLIDAY;
    } else if (dayOfWeek === 0) {
      dayType = DayType.SUNDAY;
    } else if (dayOfWeek === 6) {
      dayType = DayType.SATURDAY;
    }

    fullYearDays.push({
      date: current,
      dayType,
      holidayName,
      isCurrentMonth: true,
      isLongWeekendSequence: false,
      isBridgeSequence: false,
    });
  }

  // 2. Detect Bridges (Mostki)
  const isOffDay = (d: DayInfo) => d.dayType !== DayType.WORKDAY;

  // Scan for bridges
  fullYearDays.forEach((day, index) => {
    if (day.dayType === DayType.WORKDAY) {
      const prev = fullYearDays[index - 1];
      const next = fullYearDays[index + 1];

      // Simple 1-day bridge
      if (prev && next && isOffDay(prev) && isOffDay(next)) {
        day.dayType = DayType.BRIDGE;
      }
    }
  });

  // 3. Detect Long Weekend Sequences
  let currentSequence: DayInfo[] = [];

  const flushSequence = () => {
    if (currentSequence.length >= 3) {
      // Check if this sequence contains a bridge
      const hasBridge = currentSequence.some(d => d.dayType === DayType.BRIDGE);
      
      currentSequence.forEach(d => {
        d.isLongWeekendSequence = true;
        if (hasBridge) {
          d.isBridgeSequence = true;
        }
      });
    }
    currentSequence = [];
  };

  fullYearDays.forEach((day) => {
    if (isOffDay(day)) {
      currentSequence.push(day);
    } else {
      flushSequence();
    }
  });
  flushSequence();

  // Second pass: Identify Start/End and Cross-Week Connections
  for (let i = 0; i < fullYearDays.length; i++) {
    const day = fullYearDays[i];
    
    if (day.isLongWeekendSequence) {
      const prev = fullYearDays[i - 1];
      const next = fullYearDays[i + 1];

      // Basic start/end logic
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

  // 4. Group into Months for Display
  const months: MonthData[] = [];

  for (let m = 0; m < 12; m++) {
    const monthDays = fullYearDays.filter(d => d.date.getMonth() === m);
    const weeks: DayInfo[][] = [];
    
    const firstDay = new Date(year, m, 1);
    let startDayOfWeek = firstDay.getDay() - 1; 
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    let currentWeek: DayInfo[] = [];

    // Pad start
    for (let i = 0; i < startDayOfWeek; i++) {
        const padDate = new Date(year, m, 1 - (startDayOfWeek - i));
        currentWeek.push({
            date: padDate,
            dayType: DayType.WORKDAY,
            isCurrentMonth: false,
        });
    }

    monthDays.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    // Pad end
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
         const lastDate = currentWeek[currentWeek.length - 1].date;
         const padDate = new Date(lastDate);
         padDate.setDate(padDate.getDate() + 1);
         currentWeek.push({
            date: padDate,
            dayType: DayType.WORKDAY,
            isCurrentMonth: false,
         });
      }
      weeks.push(currentWeek);
    }

    months.push({
      name: MONTH_NAMES[m],
      year,
      monthIndex: m,
      weeks
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

  // 5a. Natural Long Weekends (ignoring bridges, just Sat/Sun/Holiday)
  // We need to re-scan because the previous loop was just counting or single-pass
  
  for (let i = 0; i < allDays.length; i++) {
    const d = allDays[i];
    const isNaturalOff = d.dayType === DayType.SATURDAY || d.dayType === DayType.SUNDAY || d.dayType === DayType.HOLIDAY;
    
    if (isNaturalOff) {
      currentSeq.push(d);
    } else {
      if (currentSeq.length >= 3) {
         longWeekendsList.push({
           start: currentSeq[0].date,
           end: currentSeq[currentSeq.length - 1].date,
           length: currentSeq.length
         });
      }
      currentSeq = [];
    }
  }
  // Flush last
  if (currentSeq.length >= 3) {
      longWeekendsList.push({
        start: currentSeq[0].date,
        end: currentSeq[currentSeq.length - 1].date,
        length: currentSeq.length
      });
  }

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
