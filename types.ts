export enum DayType {
  WORKDAY = 'WORKDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
  HOLIDAY = 'HOLIDAY',
  BRIDGE = 'BRIDGE'
}

export interface DayInfo {
  date: Date;
  dayType: DayType;
  holidayName?: string;
  isLongWeekendSequence?: boolean; // Part of a sequence of 3+ days off
  isBridgeSequence?: boolean; // True if this sequence contains a bridge day (Potential LW)
  isSequenceStart?: boolean; // Visual start of the colored bar
  isSequenceEnd?: boolean;   // Visual end of the colored bar
  connectsToNextWeek?: boolean; // True if this is Sunday and sequence continues Monday
  connectsToPrevWeek?: boolean; // True if this is Monday and sequence started before
  isCurrentMonth: boolean;
}

export interface MonthData {
  name: string;
  year: number;
  monthIndex: number; // 0-11
  weeks: DayInfo[][];
}

export interface YearStats {
  totalHolidays: number;
  holidaysOnWorkdays: number;
  holidaysOnSaturdays: number;
  holidaysOnSundays: number;
  longWeekendsCount: number;
  bridgeDaysCount: number;
  efficiencyScore: number;
  efficiencyClass: string; // A, B, C...
  longWeekendOpportunities: DayInfo[]; // Bridge days
  allHolidays: DayInfo[];
  // Composite stats
  effectiveDays: number;
  lostDays: number;
  
  // New lists
  longWeekendsList: { start: Date, end: Date, length: number }[];
  potentialWeekendsList: { start: Date, end: Date, length: number }[];
}

export interface StatRange {
  min: number;
  max: number;
  avg: number;
}

export interface GlobalStats {
  totalHolidays: StatRange;
  holidaysOnWorkdays: StatRange;
  holidaysOnSaturdays: StatRange;
  holidaysOnSundays: StatRange;
  longWeekendsCount: StatRange;
  bridgeDaysCount: StatRange;
  effectiveDays: StatRange;
  lostDays: StatRange;
}
