
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
        expect(styles.innerContainerClasses).toContain('bg-transparent'); // Was bg-brand-50
        expect(styles.innerContainerClasses).toContain('text-rose-600');
        expect(styles.tooltipText).toContain('Test Holiday');
    });

    it('should handle bridge day in sequence (inactive)', () => {
        const day = createDay({
            dayType: DayType.BRIDGE,
            isLongWeekendSequence: true,
            isBridgeSequence: true,
            sequenceInfo: { id: 'test', start: new Date(), end: new Date(), length: 3 }
        });
        const styles = getDayStyles(day, 4, false); // Not active
        
        // Should have transparent BG and NEUTRAL text
        expect(styles.innerContainerClasses).toContain('bg-transparent'); 
        expect(styles.innerContainerClasses).toContain('text-neutral-600'); 
        expect(styles.innerContainerClasses).not.toContain('text-amber-700');

        // Wavy lines still present? Yes
        expect(styles.wavyLines).toBe(true);
        expect(styles.tooltipText).toBe('Warto wziąć wolne!');
    });

    it('should handle bridge day in sequence (ACTIVE)', () => {
        const day = createDay({
            dayType: DayType.BRIDGE,
            isLongWeekendSequence: true,
            isBridgeSequence: true,
            sequenceInfo: { id: 'test', start: new Date(), end: new Date(), length: 5 }
        });
        const styles = getDayStyles(day, 4, true); // Active
        
        expect(styles.innerContainerClasses).toContain('bg-amber-50/80'); 
        expect(styles.wavyLines).toBe(true);
        // Tooltip should now include date range
        expect(styles.tooltipText).toContain('Warto wziąć wolne!');
        // For bridges we append (date - date), we don't say "Długi Weekend" explicitly
        expect(styles.tooltipText).toContain('('); 
        expect(styles.tooltipText).toContain('-');
    });

    it('should handle standard day in sequence (inactive)', () => {
        const day = createDay({
            // dayType: DayType.WORKDAY, // Default is WORKDAY
            isLongWeekendSequence: true,
            isBridgeSequence: true
        });
        const styles = getDayStyles(day, 4, false); // Inactive
        
        // Should NOT have brand-50/100 bg
        expect(styles.innerContainerClasses).toContain('bg-transparent');
        expect(styles.innerContainerClasses).not.toContain('bg-brand-100');
    });

    it('should handle standard day in sequence (ACTIVE)', () => {
        const day = createDay({
            dayType: DayType.SATURDAY,
            isLongWeekendSequence: true,
            isBridgeSequence: true,
            sequenceInfo: { id: 'test', start: new Date(2024, 4, 1), end: new Date(2024, 4, 5), length: 5 }
        });
        const styles = getDayStyles(day, 4, true); // Active
        
        // Should HAVE brand bg
        expect(styles.innerContainerClasses).toContain('bg-brand-100');
        expect(styles.tooltipText).toContain('Długi Weekend: 1 maja - 5 maja');
    });

    it('should apply sequence borders ALWAYS (structure check)', () => {
        const start = createDay({
            isLongWeekendSequence: true,
            isSequenceStart: true
        });
        
        // Inactive - should still have BORDERS (user feedback: "Obwódki powinny zostać")
        const stylesInactive = getDayStyles(start, 4, false);
        expect(stylesInactive.border).toContain('border-brand-200');
        expect(stylesInactive.border).toContain('border-l');
        
        // Active
        const stylesActive = getDayStyles(start, 4, true);
        expect(stylesActive.border).toContain('border-brand-200');
        expect(stylesActive.border).toContain('border-l');
    });

    it('should use h-9 for sequence days to match standard day height-plus-margin', () => {
        const day = createDay({
            isLongWeekendSequence: true
        });
        const styles = getDayStyles(day, 4);
        expect(styles.container).toContain('h-9');
        expect(styles.container).not.toContain('h-8');
    });

    it('should apply gray background for Sat/Sun in inactive sequence', () => {
        const day = createDay({
            dayType: DayType.SATURDAY,
            isLongWeekendSequence: true,
            isSequenceStart: true // whatever
        });
        const styles = getDayStyles(day, 4, false); // Inactive
        expect(styles.innerContainerClasses).toContain('bg-neutral-50');
        expect(styles.innerContainerClasses).not.toContain('bg-transparent');
    });

    it('should apply gray background for Holiday falling on Weekend', () => {
        // Saturday Holiday
        const day = createDay({
            date: new Date(2024, 4, 4), // May 4, 2024 is Saturday
            dayType: DayType.HOLIDAY,
            holidayName: 'Sat Holiday',
            isLongWeekendSequence: true
        });
        const styles = getDayStyles(day, 4, false); // Inactive
        expect(styles.innerContainerClasses).toContain('bg-neutral-50');
        expect(styles.innerContainerClasses).not.toContain('bg-transparent');
    });

    it('should apply gray background for SINGLE Holiday falling on Weekend', () => {
        // Sunday Holiday, NOT in sequence
        const day = createDay({
            date: new Date(2024, 4, 5), // May 5, 2024 is Sunday
            dayType: DayType.HOLIDAY,
            holidayName: 'Sun Holiday',
            isLongWeekendSequence: false // Single
        });
        const styles = getDayStyles(day, 4);
        expect(styles.innerContainerClasses).toContain('bg-neutral-50');
        expect(styles.innerContainerClasses).not.toContain('bg-transparent');
        expect(styles.innerContainerClasses).toContain('text-rose-600'); // Still red text
    });
});
