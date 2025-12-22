export interface YearCuriosities {
    maxDrought: number;
    maxDroughtMonth: string;
    maxFreeDays: number;
    lazyMonthNames: string[]; // Changed to array
    wigiliaDay: string;
    isLeap: boolean;
    workingDaysCount: number;
    freeDaysCount: number;
    holidaysOnSaturday: number;
    longWeekendsCount: number;
    efficiencyClass: string;
}

import { MonthData, DayType } from '../types';
import { generateCalendarData, getYearStats } from './dateUtils';

export const calculateYearCuriosities = (year: number): YearCuriosities => {
    const monthData = generateCalendarData(year);
    
    // Flatten all days in order
    const allDays = monthData.flatMap(m => m.weeks.flatMap(w => w.filter(d => d.isCurrentMonth)));
    
    // Helper to check if day is work
    // We can infer type from usage or just use simple duck typing if importing types is hard, 
    // but better to use the specific type if available.
    // d is likely DayData from generateCalendarData -> MonthData
    // Let's rely on structural typing or imported type. 
    // Types are in '../types'.
    // However, for now let's use a cleaner typed helper.
    const isWork = (d: { dayType: DayType }) => d.dayType === DayType.WORKDAY || d.dayType === DayType.BRIDGE;

    // 1. Longest Holiday Drought (Days without statutory holidays)
    const holidays = allDays.filter(d => d.dayType === DayType.HOLIDAY);
    let maxDrought = 0;
    let maxDroughtMonth = '';

    // We need to sort holidays by date to be sure
    holidays.sort((a,b) => a.date.getTime() - b.date.getTime());

    // Check gaps between holidays
    if (holidays.length > 0) {
        // Init with gap from Jan 1st to First Holiday (if Jan 1st is holiday, diff is 0)
        // Actually Jan 1 is always holiday.
        // Let's just scan pairs.
        for (let i = 0; i < holidays.length - 1; i++) {
            const current = holidays[i];
            const next = holidays[i+1];
            
            // Diff in days
            const diffTime = Math.abs(next.date.getTime() - current.date.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) - 1; // Subtract 1 to count days BETWEEN

            if (diffDays > maxDrought) {
                maxDrought = diffDays;
                // Format: "DD.MM - DD.MM"
                const startStr = current.date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
                const endStr = next.date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
                maxDroughtMonth = `${startStr} - ${endStr}`;
            }
        }
    }

    // 2. Laziest Month (Most free days)
    let maxFreeDays = 0;
    let lazyMonthNames: string[] = [];
    
    monthData.forEach(m => {
        const freeDaysCount = m.weeks.flatMap(w => w).filter(d => d.isCurrentMonth && !isWork(d)).length;
        if (freeDaysCount > maxFreeDays) {
            maxFreeDays = freeDaysCount;
            lazyMonthNames = [m.name];
        } else if (freeDaysCount === maxFreeDays) {
            lazyMonthNames.push(m.name);
        }
    });

    // 3. Wigilia Day
    const wigilia = new Date(year, 11, 24);
    const wigiliaDay = wigilia.toLocaleDateString('pl-PL', { weekday: 'long' });

    // 4. Leap Year
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

    // 5. Total counts
    const workingDaysCount = allDays.filter(d => isWork(d)).length;
    const freeDaysCount = allDays.length - workingDaysCount;

    // 6. Holidays on Saturday (Odbiór za sobotę)
    const holidaysOnSaturday = allDays.filter(d => {
        // Check if it is a holiday AND it is Saturday
        // In generateCalendarData, dayType might be HOLIDAY. 
        // We need to check the date.getDay() === 6.
        return d.dayType === DayType.HOLIDAY && d.date.getDay() === 6;
    }).length;

    // 7. Year Stats (Efficiency Class & Long Weekends)
    // We already have monthData generated, we can reuse it!
    const yearStats = getYearStats(monthData, true); // Assuming redeemSaturdays=true is standard for analysis

    return {
        maxDrought,
        maxDroughtMonth,
        lazyMonthNames,
        maxFreeDays,
        wigiliaDay,
        isLeap,
        workingDaysCount,
        freeDaysCount,
        holidaysOnSaturday,
        longWeekendsCount: yearStats.longWeekendsCount,
        efficiencyClass: yearStats.efficiencyClass
    };
};
