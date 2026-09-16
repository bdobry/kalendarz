import React from 'react';

export function CalendarPrintButton() {
  return <button className="calendar-print-button" type="button" onClick={() => window.print()} title="Wydrukuj lub zapisz kalendarz jako PDF">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 8V3h10v5M7 17H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-3"/><path d="M7 14h10v7H7zM17 11h.01"/></svg>
    Drukuj / PDF
  </button>;
}
