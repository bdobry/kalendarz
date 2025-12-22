import { describe, it, expect } from 'vitest';
import { calculateYearCuriosities } from './statsUtils';

describe('calculateYearCuriosities', () => {
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
