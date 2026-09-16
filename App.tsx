import React, { useState, useMemo } from 'react';
import { generateCalendarData, getYearStats, getGlobalStatsRange } from './utils/dateUtils';
import { trackEvent, AnalyticsCategory, AnalyticsAction } from './utils/analytics';
import { MonthView } from './components/MonthView';
import { Legend } from './components/Legend';
import { CalendarPrintButton } from './components/CalendarPrintButton';
import { EfficiencyDisplay } from './components/EfficiencyDisplay';
import { StatsGrid } from './components/StatsGrid';
import { HolidayList } from './components/HolidayList';
import { SeoContent } from './components/SeoContent';
import { YEAR_MIN, YEAR_MAX, yearPath, featuredYears } from './utils/seo';
import { VacationStrategy } from './components/VacationStrategy';
import { ChevronLeft, ChevronRight } from './components/Icons';
// import { VacationStrategy } from './components/VacationStrategy'; // Lazy loaded now
import { CookieBanner } from './components/CookieBanner';
import { analyzeVacationStrategies } from './utils/vacationStrategyUtils'; // Added

interface AppProps { year: number; buildYear: number; }

const App: React.FC<AppProps> = ({ year, buildYear }) => {
  const [redeemSaturdays, setRedeemSaturdays] = useState(false);
  const [hoveredSequenceId, setHoveredSequenceId] = useState<string | null>(null);

  const calendarData = useMemo(() => generateCalendarData(year), [year]);
  const strategies = useMemo(() => analyzeVacationStrategies(year), [year]);
  const yearStats = useMemo(() => getYearStats(calendarData, redeemSaturdays), [calendarData, redeemSaturdays]);
  const globalStats = useMemo(() => getGlobalStatsRange(redeemSaturdays), [redeemSaturdays]);

  const trackYear = (newYear: number) => trackEvent({
    category: AnalyticsCategory.NAVIGATION,
    action: AnalyticsAction.CHANGE_YEAR,
    label: String(newYear), value: newYear
  });
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = Number(e.target.value);
    trackYear(next);
    window.location.assign(yearPath(next));
  };
  const yearsRange = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i);

  return (
    <div className="year-page min-h-screen bg-neutral-50 text-neutral-900 pb-20 selection:bg-brand-100 selection:text-brand-900">

      
      {/* Sticky Top Section */}
      <div className="sticky top-0 z-[100] shadow-xs">
        <header className="year-header bg-canvas-default/90 backdrop-blur-sm border-b border-neutral-200/60 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav aria-label="Menu główne" className="year-nav relative flex items-center justify-between gap-3">
              
              {/* Left: Logo (Positioned absolutely on desktop to allow center to be true center) */}
              <div className="sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 flex items-center">
                {/* Icon removed */}
                <div>
                  <a href="/" className="site-brand">nierobie<span>.pl</span></a>
                </div>
              </div>

              {/* Center: Year Controls */}
              <div className="year-controls flex items-center p-0.5 sm:mx-auto z-10">
                <a
                  href={year > YEAR_MIN ? yearPath(year - 1) : undefined}
                  aria-disabled={year === YEAR_MIN}
                  onClick={() => year > YEAR_MIN && trackYear(year - 1)}
                  className="flex h-8 w-8 items-center justify-center transition-colors"
                  aria-label="Poprzedni Rok"
                >
                  <ChevronLeft className="w-4 h-4" />
                </a>
                
                <div className="relative">
                   <select 
                    aria-label="Wybierz rok"
                    value={year} 
                    onChange={handleYearChange}
                    className="h-8 appearance-none bg-transparent text-base pl-2.5 pr-6 cursor-pointer text-center transition-colors"
                   >
                     {yearsRange.map(y => (
                       <option key={y} value={y}>{y}</option>
                     ))}
                   </select>
                   {/* Custom Dropdown Arrow Overlay */}
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>

                <a
                  href={year < YEAR_MAX ? yearPath(year + 1) : undefined}
                  aria-disabled={year === YEAR_MAX}
                  onClick={() => year < YEAR_MAX && trackYear(year + 1)}
                  className="flex h-8 w-8 items-center justify-center transition-colors"
                  aria-label="Następny Rok"
                >
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
              


            </nav>
          </div>
        </header>

        {/* Cookie Banner moves here inside the sticky container */}
        <CookieBanner />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Settings Toggle moved here */}
        <div className="flex justify-end mb-4">
          <label className="inline-flex items-center cursor-pointer group">
            <input 
              type="checkbox" 
              checked={redeemSaturdays} 
              onChange={(e) => setRedeemSaturdays(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="flex flex-col items-end mr-3">
                <span className="text-xs font-bold text-neutral-700">Odbiór za sobotę</span>
                <span className="text-[10px] text-neutral-400">Dla niektórych UoP*</span>
            </div>
            <div className="year-toggle-track relative w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        {/* Dashboard Section */}
        <div className="year-dashboard grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <EfficiencyDisplay 
            efficiencyClass={yearStats.efficiencyClass} 
            year={year} 
            redeemSaturdays={redeemSaturdays}
          />
          <StatsGrid stats={yearStats} globalStats={globalStats} redeemSaturdays={redeemSaturdays} year={year} />
          <HolidayList 
            longWeekendOpportunities={yearStats.longWeekendOpportunities} 
            longWeekendsList={yearStats.longWeekendsList}
            year={year}
          />
        </div>

        {/* Calendar Grid Container */}
        <div id="kalendarz" className="year-calendar bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100 scroll-mt-40">
          
          {/* Header Bar */}
          <div className="calendar-heading">
             <h1 className="calendar-year" aria-label={`Kalendarz ${year}`}>{year}</h1>
             <Legend />
             <CalendarPrintButton />
          </div>

          <div className="calendar-months grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-2">
            {calendarData.map((month) => (
              <MonthView 
                key={month.monthIndex} 
                month={month} 
                hoveredSequenceId={hoveredSequenceId}
                onHoverSequence={setHoveredSequenceId}
              />
            ))}
          </div>
          <div className="calendar-print-footer"><span className="site-brand">nierobie<span>.pl</span></span><span>Polskie święta · Mostki urlopowe · Więcej wolnego</span></div>

        </div>
        
        <section id="planer-urlopu" className="scroll-mt-40"><VacationStrategy year={year} precalculatedStrategies={strategies} /></section>

        <SeoContent year={year} strategies={strategies} />
        
        <footer className="year-footer mt-12 py-8 border-t border-neutral-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-neutral-400 text-sm">
              <p>© {buildYear} NieRobie.pl</p>
            </div>

            {/* Internal Linking for SEO */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-neutral-500">
               <span>Szybkie linki:</span>
               <a href="/">NieRobie.pl</a>
               <a href="/kalkulator-urlopu/">Kalkulator urlopu</a>
               {featuredYears(buildYear).map(y => <a key={y} href={yearPath(y)} className="hover:text-brand-600 transition-colors">Dni wolne {y}</a>)}
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="mt-8 pt-6 border-t border-neutral-200 text-center">
            <p className="text-neutral-600 text-xs">
              Znalazłeś błąd? Masz pomysł na zmianę? Chcesz się zareklamować?{' '}
              <span className="font-bold text-neutral-800">Kontakt: </span>
              <a href="mailto:nierobie@proton.me" className="font-bold text-neutral-800 hover:text-brand-600 transition-colors">
                nierobie@proton.me
              </a>
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
