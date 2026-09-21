
import { describe, test, expect } from 'vitest';
import { generateGoogleCalendarLink, generateIcsContent } from './calendarExportUtils';

describe('calendarExportUtils', () => {
    const mockEvent = {
        title: 'Test Event',
        startDate: new Date(2025, 4, 1),
        endDate: new Date(2025, 4, 3),
        // In our app `VacationStrategy`: startDate and endDate are both INCLUSIVE (first and last day of freedom).
        // `generateGoogleCalendarLink` logic adds +1 day to endDate for exclusive handling.
        details: 'Test Details\nLine 2',
        location: 'Test Location'
    };

    test('generateGoogleCalendarLink creates correct URL', () => {
        const link = generateGoogleCalendarLink(mockEvent);
        const url = new URL(link);
        
        expect(url.origin).toBe('https://calendar.google.com');
        // Updated path for render action
        expect(url.pathname).toBe('/calendar/render'); 
        
        expect(url.searchParams.get('text')).toBe('Test Event');
        
        // We need to check the raw string for the slash because URL parsing automatically decodes it.
        // The fix specifically ensures the generated string has a literal slash.
        expect(link).toContain('dates=20250501/20250504');
        
        expect(url.searchParams.get('details')).toBe('Test Details\nLine 2');
        expect(url.searchParams.get('location')).toBe('Test Location');
        
        // action=TEMPLATE is required now
        expect(url.searchParams.get('action')).toBe('TEMPLATE'); 
    });

    test('generateIcsContent creates correct ICS format', () => {
        // Freeze time? ICS uses now.
        // We can check if it contains the fields.
        const content = generateIcsContent(mockEvent);
        
        expect(content).toContain('BEGIN:VCALENDAR');
        expect(content).toContain('VERSION:2.0');
        expect(content).toContain('DTSTART;VALUE=DATE:20250501');
        expect(content).toContain('DTEND;VALUE=DATE:20250504'); // +1 day
        expect(content).toContain('SUMMARY:Test Event');
        expect(content).toContain('DESCRIPTION:Test Details');
        expect(content).toContain('LOCATION:Test Location');
        expect(content).toContain('END:VCALENDAR');
    });

    test.each([
        [new Date(2027, 4, 27), new Date(2027, 4, 30), '20270527', '20270531'],
        [new Date(2026, 2, 28), new Date(2026, 2, 30), '20260328', '20260331'],
        [new Date(2026, 9, 24), new Date(2026, 9, 26), '20261024', '20261027'],
        [new Date(2026, 11, 31), new Date(2027, 0, 3), '20261231', '20270104']
    ])('preserves civil dates across DST and year boundaries', (startDate, endDate, start, end) => {
        const event = { ...mockEvent, startDate, endDate };
        expect(new URL(generateGoogleCalendarLink(event)).searchParams.get('dates')).toBe(`${start}/${end}`);
        expect(generateIcsContent(event)).toContain(`DTSTART;VALUE=DATE:${start}`);
        expect(generateIcsContent(event)).toContain(`DTEND;VALUE=DATE:${end}`);
    });
});
