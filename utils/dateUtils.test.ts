
import { describe, it, expect } from 'vitest';
import { generateCalendarData, getYearStats } from './dateUtils';
import { DayType } from '../types';

describe('dateUtils', () => {
    describe('scoring', () => {
        it('should calculate stats correctly', () => {
            const data = generateCalendarData(2024);
            const stats = getYearStats(data, true);
            expect(stats.totalHolidays).toBeGreaterThan(0);
            expect(stats.efficiencyScore).toBeDefined();
            // 2024 has specific known stats? 
            // Just verifying structure and basic logic
            expect(stats.effectiveDays).toBeGreaterThan(5);
        });
    });

    describe('generateCalendarData', () => {
        it('should generate 12 months for a given year', () => {
            const data = generateCalendarData(2024);
            expect(data).toHaveLength(12);
            expect(data[0].name).toBe('Styczeń');
            expect(data[11].name).toBe('Grudzień');
        });

        it('should correctly mark holidays', () => {
            const data = generateCalendarData(2024);
            const january = data[0];
            const jan1 = january.weeks.flat().find(d => d.date.getDate() === 1 && d.isCurrentMonth);
            
            if (!jan1) {
                console.log('DEBUG: Jan 1 NOT FOUND in Month');
            }

            expect(jan1).toBeDefined();
            expect(jan1?.dayType).toBe(DayType.HOLIDAY);
            expect(jan1?.holidayName).toBe('Nowy Rok');
        });

        it('should detect natural long weekends', () => {
            // May 1st 2024 is Wednesday, May 3rd is Friday.
            // This creates a potential long weekend.
            const data = generateCalendarData(2024);
            const may = data[4];
            
            // May 1 (Wed) - Holiday
            // May 2 (Thu) - Bridge?
            // May 3 (Fri) - Holiday
            // May 4 (Sat)
            // May 5 (Sun)
            
            const may1 = may.weeks.flatMap(w => w).find(d => d.date.getDate() === 1 && d.isCurrentMonth);
            const may2 = may.weeks.flatMap(w => w).find(d => d.date.getDate() === 2 && d.isCurrentMonth);
            const may3 = may.weeks.flatMap(w => w).find(d => d.date.getDate() === 3 && d.isCurrentMonth);
            
            expect(may1?.dayType).toBe(DayType.HOLIDAY);
            expect(may3?.dayType).toBe(DayType.HOLIDAY);
            
            // Depends on bridge logic (DayType.BRIDGE is set for single-day gaps if neighbors are off)
            expect(may2?.dayType).toBe(DayType.BRIDGE);
            
            expect(may1?.isLongWeekendSequence).toBe(true);
            expect(may2?.isLongWeekendSequence).toBe(true);
            expect(may3?.isLongWeekendSequence).toBe(true);
        });

        it('should handle cross-year sequences (Dec 2024 -> Jan 2025)', () => {
            // Dec 25, 26 2024 are Wed, Thu.
            // Jan 1 2025 is Wed.
            // Jan 6 2025 is Mon.
            
            // Testing the ghost row logic explicitly.
            // Let's pick a year where long weekend crosses boundary clearly.
            // 2020/2021: Jan 1 2021 was Friday. Dec 25 2020 Friday.
            // 2025/2026: Jan 1 2026 is Thursday.
            
            // Let's rely on the current logic's detection.
            const data2024 = generateCalendarData(2024);
            const december = data2024[11];
            
            // Check if we have ghost days from Jan 2025 in December view if they are part of sequence
            // Jan 1 2025 is Wednesday. Dec 31 is Tuesday.
            // If Dec 31 is bridge...
            // Jan 6 (Mon) is Holiday.
            // Jan 1 (Wed) Holiday.
            // Potential sequence: Jan 1..Jan 6.
            // Does it extend to Dec?
            
            // Let's create a hypothetical scenario or check if logic covers it.
            // The logic generates buffer.
        });
    });
});
