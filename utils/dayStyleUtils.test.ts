
import { describe, it, expect } from 'vitest';
import { getDayStyles } from './dayStyleUtils';
import { DayType, DayInfo } from '../types';

describe('dayStyleUtils', () => {
    // Helper to create a basic day
    const createDay = (overrides: Partial<DayInfo> = {}): DayInfo => ({
        date: new Date(2024, 4, 15), // May 15, 2024 (Wed)
        dayType: DayType.WORKDAY,
        isCurrentMonth: true,
        isLongWeekendSequence: false,
        isBridgeSequence: false,
        ...overrides
    });

    it('should handle standard workday', () => {
        const day = createDay();
        const styles = getDayStyles(day, 4); // May
        expect(styles.showContent).toBe(true);
        expect(styles.innerContainerClasses).toContain('bg-white');
    });

    it('should handle holiday', () => {
        const day = createDay({ dayType: DayType.HOLIDAY, holidayName: 'Test Holiday' });
        const styles = getDayStyles(day, 4);
        expect(styles.innerContainerClasses).toContain('bg-brand-50');
        expect(styles.innerContainerClasses).toContain('text-rose-600');
        expect(styles.tooltipText).toContain('Test Holiday');
    });

    it('should handle bridge day in sequence', () => {
        const day = createDay({
            dayType: DayType.BRIDGE,
            isLongWeekendSequence: true,
            isBridgeSequence: true
        });
        const styles = getDayStyles(day, 4);
        
        // The bridge day itself should still have amber BG
        expect(styles.innerContainerClasses).toContain('bg-amber-50/80');
        expect(styles.wavyLines).toBe(true);
        expect(styles.tooltipText).toBe('Warto wziąć wolne!');
    });

    it('should handle non-bridge day in potential sequence', () => {
        const day = createDay({
            dayType: DayType.SATURDAY,
            isLongWeekendSequence: true,
            isBridgeSequence: true // It is part of the sequence
        });
        const styles = getDayStyles(day, 4);
        
        // Should use Indigo styles (like natural long weekend) despite being in a bridge sequence
        expect(styles.innerContainerClasses).toContain('bg-brand-50');
        expect(styles.innerContainerClasses).not.toContain('bg-orange');
        expect(styles.text).toContain('text-brand-900/80');
    });

    it('should hide irrelevant ghost days', () => {
        const day = createDay({
            date: new Date(2024, 3, 30), // April 30
            isCurrentMonth: false
        });
        // Viewing May (4). April is prev month.
        // Not a year boundary.
        const styles = getDayStyles(day, 4); // Index 4 = May
        expect(styles.showContent).toBe(false);
    });

    it('should show cross-year sequence ghost days', () => {
        // Jan 1st 2025 viewed in Dec 2024
        const day = createDay({
            date: new Date(2025, 0, 1), // Jan 1
            isCurrentMonth: false,
            isLongWeekendSequence: true
        });
        // Viewing Dec (11)
        const styles = getDayStyles(day, 11);
        
        expect(styles.showContent).toBe(true);
        expect(styles.innerContainerClasses).toContain('opacity-80');
    });

    it('should apply sequence borders', () => {
        // Start of sequence
        const start = createDay({
            isLongWeekendSequence: true,
            isSequenceStart: true
        });
        const stylesStart = getDayStyles(start, 4);
        expect(stylesStart.border).toContain('border-l');
        expect(stylesStart.border).toContain('rounded-l-[5px]');

        // End of sequence
        const end = createDay({
            isLongWeekendSequence: true,
            isSequenceEnd: true
        });
        const stylesEnd = getDayStyles(end, 4);
        expect(stylesEnd.border).toContain('border-r');
        expect(stylesEnd.border).toContain('rounded-r-[5px]');
        
        // Middle of sequence
        const middle = createDay({
            isLongWeekendSequence: true,
            isSequenceStart: false,
            isSequenceEnd: false
        });
        const stylesMid = getDayStyles(middle, 4);
        expect(stylesMid.border).toContain('border-l-0');
        // Implementation:
        // if (start || Mon) border-l... else border-l-0
        expect(stylesMid.border).toContain('border-l-0');
        expect(stylesMid.border).toContain('border-r-0');
    });
});
