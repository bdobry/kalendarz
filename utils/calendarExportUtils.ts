export interface CalendarEvent {
  title: string;
  startDate: Date;
  endDate: Date;
  details?: string;
  location?: string;
}

const formatDateToISOBasic = (date: Date): string => {
  // YYYYMMDD
  return date.toISOString().replace(/[-:]/g, '').split('T')[0];
};

export const generateGoogleCalendarLink = (event: CalendarEvent): string => {
  const start = formatDateToISOBasic(event.startDate);
  // Google Calendar "dates" end date is exclusive, so we add 1 day if it's an all-day event
  // Assuming vacation strategies are all-day events.
  const endDate = new Date(event.endDate);
  endDate.setDate(endDate.getDate() + 1);
  const end = formatDateToISOBasic(endDate);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: event.details || '',
    location: event.location || '',
  });

  // Google Calendar TEMPLATE action requires the slash in dates to be literal, not encoded (%2F)
  return `https://calendar.google.com/calendar/render?${params.toString().replace('%2F', '/')}`;
};

export const generateIcsContent = (event: CalendarEvent): string => {
  // ICS end date is also exclusive for all-day events
  const endDate = new Date(event.endDate);
  endDate.setDate(endDate.getDate() + 1);

  const start = formatDateToISOBasic(event.startDate);
  const end = formatDateToISOBasic(endDate);
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//nierobie.pl//VacationStrategy//PL
BEGIN:VEVENT
UID:${now}-${start}@nierobie.pl
DTSTAMP:${now}
DTSTART;VALUE=DATE:${start}
DTEND;VALUE=DATE:${end}
SUMMARY:${event.title}
DESCRIPTION:${event.details || ''}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;
};

export const downloadIcsFile = (event: CalendarEvent, filename: string = 'urlop.ics') => {
  const content = generateIcsContent(event);
  // Use generic binary type to force download if browser tries to just preview it, 
  // but text/calendar is correct. Let's try text/calendar first but ensure the link is set up correctly.
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  // Use property instead of attribute for better compatibility
  link.download = filename; 
  
  // Appending to body is required for Firefox
  document.body.appendChild(link);
  
  try {
      link.click();
  } finally {
      document.body.removeChild(link);
      // Small timeout to allow download to start before revoking
      setTimeout(() => {
          window.URL.revokeObjectURL(url);
      }, 100);
  }
};
