export interface YearCuriosities {
    maxDrought: number;
    maxDroughtMonth: string;
    maxFreeDays: number;
    lazyMonthNames: string[]; // Changed to array
    wigiliaDay: string;
    isLeap: boolean;
    workingDaysCount: number;
    freeDaysCount: number;
    totalDays: number;
    saturdaysCount: number;
    sundaysCount: number;
    weekendDaysCount: number;
    fullWeekendsCount: number;
    holidaysCount: number;
    holidaysOnWeekdays: number;
    holidaysOnSunday: number;
    workingDaysWithRedemption: number;
    workingHours: number;
    freeDaysWithRedemption: number;
    months: MonthWorkStats[];
    holidaysOnSaturday: number;
    longWeekendsCount: number;
    efficiencyClass: string;
}

export interface MonthWorkStats {
    name: string;
    calendarWorkingDays: number;
    saturdayHolidays: number;
    workingDays: number;
    workingHours: number;
}

import { DayType } from '../types';
import { generateCalendarData, getYearStats } from './dateUtils';

export const calculateYearCuriosities = (year: number): YearCuriosities => {
    const monthData = generateCalendarData(year);
    
    // Flatten all days in order
    const allDays = monthData.flatMap(m => m.weeks.flatMap(w => w.filter(d => d.isCurrentMonth)));
    
    // Bridge days still require leave, so they remain working days.
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
            const dayNumber = (date: Date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000;
            const diffDays = dayNumber(next.date) - dayNumber(current.date) - 1;

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
    const holidaysOnSaturday = holidays.filter(d => d.date.getDay() === 6).length;
    const holidaysOnSunday = holidays.filter(d => d.date.getDay() === 0).length;
    // Count weekdays by date: a public holiday can also be a Saturday or Sunday.
    const saturdaysCount = allDays.filter(d => d.date.getDay() === 6).length;
    const sundaysCount = allDays.filter(d => d.date.getDay() === 0).length;
    const fullWeekendsCount = allDays.filter(d => d.date.getDay() === 6 && !(d.date.getMonth() === 11 && d.date.getDate() === 31)).length;
    const workingDaysWithRedemption = workingDaysCount - holidaysOnSaturday;
    // Monthly dimensions assume monthly accounting periods. The employer's actual
    // day off may fall in another month within a longer accounting period.
    const months = monthData.map(month => {
        const days = month.weeks.flatMap(week => week.filter(day => day.isCurrentMonth));
        const calendarWorkingDays = days.filter(isWork).length;
        const saturdayHolidays = days.filter(day => day.dayType === DayType.HOLIDAY && day.date.getDay() === 6).length;
        const workingDays = calendarWorkingDays - saturdayHolidays;
        return { name: month.name, calendarWorkingDays, saturdayHolidays, workingDays, workingHours: workingDays * 8 };
    });

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
        totalDays: allDays.length,
        saturdaysCount,
        sundaysCount,
        weekendDaysCount: saturdaysCount + sundaysCount,
        fullWeekendsCount,
        holidaysCount: holidays.length,
        holidaysOnWeekdays: holidays.length - holidaysOnSaturday - holidaysOnSunday,
        holidaysOnSunday,
        workingDaysWithRedemption,
        workingHours: workingDaysWithRedemption * 8,
        freeDaysWithRedemption: freeDaysCount + holidaysOnSaturday,
        months,
        holidaysOnSaturday,
        longWeekendsCount: yearStats.longWeekendsCount,
        efficiencyClass: yearStats.efficiencyClass
    };
};
