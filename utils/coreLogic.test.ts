
import { describe, it, expect } from 'vitest';
import { generateCalendarData, getYearStats } from './dateUtils';
import { analyzeVacationStrategies } from './vacationStrategyUtils';
import { DayType } from '../types';

// Easter Truth Table (Western Gregorian)
const EASTER_DATES: Record<number, string> = {
  2025: '2025-04-20',
  2026: '2026-04-05',
  2027: '2027-03-28',
  2028: '2028-04-16',
  2029: '2029-04-01',
  2030: '2030-04-21',
  2031: '2031-04-13',
  2032: '2032-03-28',
  2033: '2033-04-17',
  2034: '2034-04-09',
  2035: '2035-03-25',
  2036: '2036-04-13',
  2037: '2037-04-05',
  2038: '2038-04-25',
  2039: '2039-04-10',
  2040: '2040-04-01',
  2041: '2041-04-21',
  2042: '2042-04-06',
  2043: '2043-03-29',
  2044: '2044-04-17',
  2045: '2045-04-09',
  2049: '2049-04-18',
  2050: '2050-04-10',
  2099: '2099-04-12' // Late Easter Check
};

const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

describe('Core Logic Verification', () => {
    
    describe('Easter Calculation Accuracy (Comparison with Known Dates)', () => {
        Object.entries(EASTER_DATES).forEach(([yearStr, expectedDate]) => {
            const year = parseInt(yearStr);
            it(`should correctly calculate Easter for ${year}`, () => {
                const data = generateCalendarData(year);
                // Find Easter Sunday
                const easterSunday = data.flatMap(m => m.weeks.flat())
                    .find(d => d.isCurrentMonth && d.dayType === DayType.HOLIDAY && d.holidayName === 'Wielkanoc');
                
                expect(easterSunday).toBeDefined();
                if (easterSunday) {
                    expect(formatDate(easterSunday.date)).toBe(expectedDate);
                }
            });
        });
    });
    
    describe('Leap Year Logic', () => {
        const checkYear = (year: number, shouldHaveFeb29: boolean) => {
            const data = generateCalendarData(year);
            const february = data.find(m => m.monthIndex === 1); // 0-indexed, Feb is 1
            expect(february).toBeDefined();
            
            const feb29 = february?.weeks.flat().find(d => d.date.getDate() === 29 && d.date.getMonth() === 1 && d.isCurrentMonth);
            
            if (shouldHaveFeb29) {
                expect(feb29).toBeDefined();
                expect(feb29?.date.getDate()).toBe(29);
            } else {
                expect(feb29).toBeUndefined();
            }
        };

        it('should have Feb 29 in 2024 (Leap)', () => checkYear(2024, true));
        it('should NOT have Feb 29 in 2025 (Non-Leap)', () => checkYear(2025, false));
        it('should have Feb 29 in 2028 (Leap)', () => checkYear(2028, true));
        it('should have Feb 29 in 2096 (Leap)', () => checkYear(2096, true));
        it('should NOT have Feb 29 in 2099 (Non-Leap)', () => checkYear(2099, false));
        // 2100 is NOT a leap year (divisible by 100 but not 400), but checking up to 2099 as requested/defined
    });

    describe('Vacation Strategy & Holiday Logic', () => {
        it('should handle "Wigilia" (Dec 24) free day logic correctly', () => {
            // 2024: Wigilia is working day (unless weekend)
            // 24 Dec 2024 is Tuesday -> Workday
            const data2024 = generateCalendarData(2024);
            const dec24_2024 = data2024[11].weeks.flat().find(d => d.date.getDate() === 24 && d.isCurrentMonth);
            expect(dec24_2024?.dayType).toBe(DayType.WORKDAY);
            expect(dec24_2024?.holidayName).toBeUndefined();

            // 2025: Wigilia is free day (Change in law/logic)
            // 24 Dec 2025 is Wednesday -> Holiday
            const data2025 = generateCalendarData(2025);
            const dec24_2025 = data2025[11].weeks.flat().find(d => d.date.getDate() === 24 && d.isCurrentMonth);
            expect(dec24_2025?.dayType).toBe(DayType.HOLIDAY);
            expect(dec24_2025?.holidayName).toContain('Wigilia');
        });
        
        it('should correctly name period types in strategies', () => {
            const strats = analyzeVacationStrategies(2025);
            
            // Check major periods
            const majowka = strats.find(s => s.description.includes('Maj') || s.periodName === 'Majówka');
            const xmas = strats.find(s => s.periodName === 'Boże Narodzenie');
            
            expect(majowka).toBeDefined();
            expect(majowka?.periodName).toBe('Majówka');
            
            expect(xmas).toBeDefined();
            expect(xmas?.periodName).toBe('Boże Narodzenie');
        });
        
        it('should calculate stats including bridge days correctly', () => {
             // 2029 Regression check (May 1 Tue, May 3 Thu -> May 2 Wed is Bridge)
             const data2029 = generateCalendarData(2029);
             const stats = getYearStats(data2029, true);
             
             // We expect May 2 to be counted as a Bridge Day
             // May 2 is Wednesday.
             const may = data2029[4];
             const may2 = may.weeks.flat().find(d => d.date.getDate() === 2 && d.isCurrentMonth);
             
             expect(may2?.dayType).toBe(DayType.BRIDGE);
             expect(stats.bridgeDaysCount).toBeGreaterThan(0);
        });
    });
});
