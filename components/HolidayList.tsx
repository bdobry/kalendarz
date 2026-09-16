import React, { useMemo } from 'react';
import { DayInfo } from '../types';
import { formatDateKey, getSingleDayBreak } from '../utils/dateUtils';
import { trackEvent, AnalyticsCategory, AnalyticsAction } from '../utils/analytics';
import { getTwoDayBreaks } from '../utils/vacationSuggestions';

interface HolidayListProps {
  longWeekendOpportunities: DayInfo[];
  longWeekendsList: { start: Date; end: Date; length: number }[];
  year: number;
}

const formatDate = (date: Date, withYear = false) => date.toLocaleDateString('pl-PL', {
  day: '2-digit', month: '2-digit', ...(withYear ? { year: 'numeric' } : {}),
});
const formatRange = (start: Date, end: Date, year: number) => {
  const crossesYear = start.getFullYear() !== year || end.getFullYear() !== year;
  return `${formatDate(start, crossesYear)} – ${formatDate(end, crossesYear)}`;
};

export const HolidayList: React.FC<HolidayListProps> = ({ longWeekendOpportunities, longWeekendsList, year }) => {
  const twoDayBreaks = useMemo(() => getTwoDayBreaks(year), [year]);
  const handleJumpToDay = (date: Date, highlightDates: Date[] = []) => {
    const element = document.getElementById(`day-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      highlightDates.forEach(day => {
        const cell = document.getElementById(`day-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`);
        if (cell) {
          cell.classList.add('calendar-leave-highlight', 'transition-colors', 'duration-500');
          setTimeout(() => cell.classList.remove('calendar-leave-highlight'), 1000);
        }
      });
    }
  };

  return <div className="year-panel year-opportunities bg-white p-6 flex flex-col h-[460px]">
    <div className="opportunity-heading">
      <h3 className="text-lg leading-tight">Strategia urlopowa</h3>
      <p>Wybierz przerwę. Zobacz ją w kalendarzu.</p>
    </div>
    <div className="opportunity-groups" id="long-weekends-section">
      <details name="year-opportunity-groups" open={longWeekendOpportunities.length > 0}>
        <summary><span>Z 1 dniem urlopu</span><span className="opportunity-count">Terminy: {longWeekendOpportunities.length}</span><span className="opportunity-chevron" aria-hidden="true">⌄</span></summary>
        <div id="potential-weekends-list" className="opportunity-list">
          {longWeekendOpportunities.length ? longWeekendOpportunities.map(day => {
            const period = getSingleDayBreak(day.date);
            return <button key={formatDateKey(day.date)} className="opportunity-row group" onClick={() => {
              handleJumpToDay(day.date, [day.date]);
              trackEvent({ category: AnalyticsCategory.LONG_WEEKEND, action: AnalyticsAction.CLICK_SMART_MOVE, label: formatDate(day.date) });
            }}>
              <span className="opportunity-dates"><strong>Weź urlop {formatDate(day.date)} <span>({day.date.toLocaleDateString('pl-PL', { weekday: 'short' })})</span></strong><span>Wypoczynek: {formatRange(period.start, period.end, year)}</span></span>
              <span className="opportunity-result"><strong>{period.length}</strong><span>dni wolnego</span></span>
            </button>;
          }) : <p className="opportunity-empty">Brak mostków z 1 dniem urlopu. Więcej możliwości znajdziesz w planerze poniżej.</p>}
        </div>
      </details>
      <details name="year-opportunity-groups">
        <summary><span>Z 2 dniami urlopu</span><span className="opportunity-count">Terminy: {twoDayBreaks.length}</span><span className="opportunity-chevron" aria-hidden="true">⌄</span></summary>
        <div id="two-day-weekends-list" className="opportunity-list">
          {twoDayBreaks.length ? twoDayBreaks.map(period => {
            const withYear = period.vacationDays.some(date => date.getFullYear() !== year);
            const leaveDates = period.vacationDays.map(date => formatDate(date, withYear)).join(' i ');
            return <button key={period.id} className="opportunity-row group" onClick={() => {
              handleJumpToDay(period.vacationDays[0], period.vacationDays);
              trackEvent({ category: AnalyticsCategory.LONG_WEEKEND, action: AnalyticsAction.CLICK_SMART_MOVE, label: `2 dni: ${leaveDates}`, value: period.freeDays });
            }}>
              <span className="opportunity-dates"><strong>Weź urlop {leaveDates}</strong><span>Wypoczynek: {formatRange(period.startDate, period.endDate, year)}</span></span>
              <span className="opportunity-result"><strong>{period.freeDays}</strong><span>dni wolnego</span></span>
            </button>;
          }) : <p className="opportunity-empty">Brak przerw trwających co najmniej 5 dni za 2 dni urlopu. Sprawdź inne warianty w planerze.</p>}
        </div>
      </details>
      <details name="year-opportunity-groups" open={longWeekendOpportunities.length === 0}>
        <summary><span>Bez urlopu</span><span className="opportunity-count">Terminy: {longWeekendsList.length}</span><span className="opportunity-chevron" aria-hidden="true">⌄</span></summary>
        <div id="long-weekends-list" className="opportunity-list">
          {longWeekendsList.length ? longWeekendsList.map(period => <button key={formatDateKey(period.start)} className="opportunity-row group" onClick={() => {
            // The first day of a cross-year break may be outside the displayed calendar.
            handleJumpToDay(period.start.getFullYear() < year ? new Date(year, 0, 1) : period.start);
            trackEvent({ category: AnalyticsCategory.LONG_WEEKEND, action: AnalyticsAction.CLICK_LONG_WEEKEND, label: formatRange(period.start, period.end, year), value: period.length });
          }}>
            <span className="opportunity-dates"><strong>{formatRange(period.start, period.end, year)}</strong><span>Nie zużywasz urlopu</span></span>
            <span className="opportunity-result"><strong>{period.length}</strong><span>dni wolnego</span></span>
          </button>) : <p className="opportunity-empty">Brak przerw trwających co najmniej 3 dni bez urlopu.</p>}
        </div>
      </details>
    </div>
    <div className="opportunity-footer"><a href="#planer-urlopu">Porównaj wszystkie plany <span aria-hidden="true">↓</span></a><a href="#swieta">Lista świąt <span aria-hidden="true">↗</span></a></div>
  </div>;
};
