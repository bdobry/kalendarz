import { describe, expect, it } from 'vitest';
import { generateCalendarData } from './utils/dateUtils';

describe('debug_natural_weekend', () => {
  it('logs continuity between December 2023 and January 2024 without failing the suite', () => {
    console.log("DEBUG: Checking Dec 2023 -> Jan 2024 connection");

    const data2023 = generateCalendarData(2023);
    const dec2023 = data2023[11]; // December
    const lastWeek = dec2023.weeks[dec2023.weeks.length - 1];

    // Find Dec 31
    const dec31 = lastWeek.find(d => d.date.getDate() === 31 && d.isCurrentMonth);
    if (dec31) {
        console.log("Dec 31 2023:");
        console.log(`  Type: ${dec31.dayType}`);
        console.log(`  isLongWeekendSequence: ${dec31.isLongWeekendSequence}`);
        console.log(`  isSequenceEnd: ${dec31.isSequenceEnd}`);
        console.log(`  Next Day (in buffer logic) should be Jan 1`);
    } else {
        console.log("ERROR: Dec 31 2023 not found in last week");
    }

    // Check for Ghost Day Jan 1
    const jan1Ghost = lastWeek.find(d => d.date.getDate() === 1 && !d.isCurrentMonth);
    if (jan1Ghost) {
        console.log("Jan 1 2024 (Ghost):");
        console.log(`  Type: ${jan1Ghost.dayType}`);
        console.log(`  isLongWeekendSequence: ${jan1Ghost.isLongWeekendSequence}`);
        console.log(`  isBridgeSequence: ${jan1Ghost.isBridgeSequence}`);
    } else {
        console.log("Jan 1 2024 (Ghost) NOT FOUND in Dec 2023 view");
        console.log("Full Last Week:");
        lastWeek.forEach(d => {
            console.log(`  ${d.date.toISOString().split('T')[0]} - Cur: ${d.isCurrentMonth} - LWS: ${d.isLongWeekendSequence}`);
        });
    }

    expect(Array.isArray(lastWeek)).toBe(true);
  });
});
