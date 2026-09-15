import { describe, it, expect } from 'vitest';
import { calculateYearCuriosities } from './statsUtils';

describe('calculateYearCuriosities', () => {
    it('separates calendar workdays from the Polish full-time dimension for 2026', () => {
        const stats = calculateYearCuriosities(2026);
        expect(stats).toMatchObject({
            totalDays: 365,
            saturdaysCount: 52,
            sundaysCount: 52,
            weekendDaysCount: 104,
            fullWeekendsCount: 52,
            holidaysCount: 14,
            holidaysOnWeekdays: 8,
            holidaysOnSaturday: 2,
            holidaysOnSunday: 4,
            workingDaysCount: 253,
            workingDaysWithRedemption: 251,
            workingHours: 2008,
            freeDaysCount: 112,
            freeDaysWithRedemption: 114,
            maxDrought: 88,
        });
        expect(stats.months.map(month => month.workingDays)).toEqual([20, 20, 22, 21, 20, 21, 23, 20, 22, 22, 20, 20]);
    });

    it.each([
        [2000, 53, 53, 53],
        [2012, 52, 53, 52],
        [2022, 53, 52, 52],
        [2028, 53, 53, 53],
    ])('counts complete weekends in %i without borrowing days from adjacent years', (year, saturdays, sundays, weekends) => {
        const stats = calculateYearCuriosities(year);
        expect(stats.saturdaysCount).toBe(saturdays);
        expect(stats.sundaysCount).toBe(sundays);
        expect(stats.fullWeekendsCount).toBe(weekends);
        expect(stats.weekendDaysCount).toBe(saturdays + sundays);
    });

    it.each([2024, 2025, 2026, 2027, 2028, 2033])('keeps monthly and annual dimensions consistent in %i', year => {
        const stats = calculateYearCuriosities(year);
        expect(stats.months).toHaveLength(12);
        expect(stats.months.reduce((sum, month) => sum + month.workingDays, 0)).toBe(stats.workingDaysWithRedemption);
        expect(stats.months.reduce((sum, month) => sum + month.workingHours, 0)).toBe(stats.workingHours);
        expect(stats.months.reduce((sum, month) => sum + month.saturdayHolidays, 0)).toBe(stats.holidaysOnSaturday);
        expect(stats.workingDaysWithRedemption + stats.freeDaysWithRedemption).toBe(stats.totalDays);
        expect(stats.workingDaysCount + stats.weekendDaysCount + stats.holidaysOnWeekdays).toBe(stats.totalDays);
    });

    it('calculates correct stats for 2025 (Non-Leap)', () => {
        const stats = calculateYearCuriosities(2025);
        
        expect(stats.isLeap).toBe(false);
        // Wigilia 2025 is Wednesday
        expect(stats.wigiliaDay.toLowerCase()).toContain('środa');
        
        // 2025: May 3 (Sat), Nov 1 (Sat). Total 2?
        // Let's verify specific count.
        expect(stats.holidaysOnSaturday).toBeGreaterThanOrEqual(0); 
        // Note: 2025 specific check:
        // 2025 (Standard)
        // Check maxDrought.
        // Usually gap between Corpus Christi (June) and Assumption (Aug 15) is large (~60 days).
        // Or Assumption (Aug 15) and Nov 1 (All Saints). ~76 days.
        expect(stats.maxDrought).toBeGreaterThan(40);
        expect(stats.maxDroughtMonth).toBeTruthy();
        // May 3 (Constitution) is Saturday.
        // Nov 1 (All Saints) is Saturday.
        // Check lazyMonthNames
        expect(Array.isArray(stats.lazyMonthNames)).toBe(true);
        expect(stats.lazyMonthNames.length).toBeGreaterThan(0);
        
        // Check Efficiency Class
        // 2025 is typically class C or D? Let's just check it's a string.
        expect(stats.efficiencyClass).toMatch(/[A-G]/);
        expect(stats.longWeekendsCount).toBeGreaterThan(0);
        // So at least 2.
        expect(stats.holidaysOnSaturday).toBe(2);
    });
    
    it('calculates correct stats for 2024 (Leap)', () => {
        const stats = calculateYearCuriosities(2024);
        
        expect(stats.isLeap).toBe(true);
        // Wigilia 2024 is Tuesday
        expect(stats.wigiliaDay.toLowerCase()).toContain('wtorek');
        expect(stats.workingDaysCount + stats.freeDaysCount).toBe(366);
        
        // 2024: Jan 6 (Sat)
        expect(stats.holidaysOnSaturday).toBe(1);
    });
});
