
import { describe, it, expect } from 'vitest';
import { generateCalendarData, DayType } from './dateUtils';

describe('Ghost Day Visibility Logic', () => {
    it('should NOT show disconnected previous month sequences in current month view', () => {
        // Scenario: 2023/2024 (Matches screenshot 1 logic approximately)
        // Dec 25, 26 2023 (Mon, Tue) - Sequence A
        // Dec 30, 31 2023 (Sat, Sun) + Jan 1 2024 (Mon) - Sequence B
        // Gap between A and B (Dec 27, 28, 29).
        
        const data = generateCalendarData(2024);
        const january = data[0]; // January 2024
        
        // Find ghost days from Dec 2023 in Jan view
        const ghostDays = january.weeks.flat().filter(d => !d.isCurrentMonth && d.date.getMonth() === 11);
        
        // We expect to find Dec 30, 31 (Sat, Sun) because they connect to Jan 1
        const dec31 = ghostDays.find(d => d.date.getDate() === 31);
        expect(dec31).toBeDefined();
        // It should be part of a sequence (connected to Jan 1)
        expect(dec31?.isLongWeekendSequence).toBe(true); 

        // We expect NOT to see Dec 25, 26 explicitly as sequences
        // Or rather, they might be in the grid (for row completeness), but they should be marked as NOT a sequence
        // so that DayCell hides them.
        
        // Note: The current implementation purely returns DayInfo. 
        // If isLongWeekendSequence is true, DayCell shows it.
        // So we expect isLongWeekendSequence to be FALSE for Dec 25/26 in the CONTEXT of January.
        
        const dec25 = ghostDays.find(d => d.date.getDate() === 25);
        if (dec25) {
             console.log('Dec 25 found in Jan view. status:', dec25.isLongWeekendSequence);
             // This assertion fails currently, confirming the bug
             expect(dec25.isLongWeekendSequence).toBe(false);
        }
    });

    it('should NOT show disconnected next month sequences', () => {
        const data = generateCalendarData(2024);
        const december = data[11];
        
        const ghostDays = december.weeks.flat().filter(d => !d.isCurrentMonth && d.date.getMonth() === 0);
        
        // Jan 6
        const jan6 = ghostDays.find(d => d.date.getDate() === 6);
        if (jan6) {
             expect(jan6.isLongWeekendSequence).toBe(false);
        }
    });

    it('should remove fully empty rows', () => {
        // Scenario: A month where grid extension adds a row, but visibility rules hide it.
        // E.g. Dec 2024. If we extended for Jan sequence but then hid it because... 
        // Actually, Dec/Jan IS a year boundary, so it WOULD show.
        // Let's try Nov 2024 / Dec 2024 sequence.
        // If Nov 30 connects to Dec 1?
        // Standard view.
        
        // Let's create a hypothetical scenario or check a known one.
        // If we generate 2024 data.
        // Check all months. Ensure no week is completely empty of visible content.
        // Visible content = isCurrentMonth OR isLongWeekendSequence.
        
        const data = generateCalendarData(2024);
        
        data.forEach(month => {
            month.weeks.forEach((week, wIndex) => {
                const hasVisible = week.some(d => d.isCurrentMonth || d.isLongWeekendSequence);
                if (!hasVisible) {
                    console.log(`Found empty row in ${month.name} week ${wIndex}`);
                    console.log(week.map(d => `${d.date.toISOString()} cur:${d.isCurrentMonth} seq:${d.isLongWeekendSequence}`));
                }
                expect(hasVisible).toBe(true);
            });
        });
    });
});
