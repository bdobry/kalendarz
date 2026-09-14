import React, { useState, useMemo } from 'react';
import { generateCalendarData, getYearStats, getGlobalStatsRange } from './utils/dateUtils';
import { trackEvent, AnalyticsCategory, AnalyticsAction } from './utils/analytics';
import { MonthView } from './components/MonthView';
import { Legend } from './components/Legend';
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
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-20 selection:bg-brand-100 selection:text-brand-900">

      
      {/* Sticky Top Section */}
      <div className="sticky top-0 z-[100] shadow-xs">
        <header className="bg-canvas-default/90 backdrop-blur-sm border-b border-neutral-200/60 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex flex-col sm:flex-row items-center justify-between py-4">
              
              {/* Left: Logo (Positioned absolutely on desktop to allow center to be true center) */}
              <div className="sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-3 mb-4 sm:mb-0">
                {/* Icon removed */}
                <div>
                  <a href="/" className="text-xl font-bold text-neutral-900 tracking-tight">NieRobie.pl</a>
                </div>
              </div>

              {/* Center: Year Controls */}
              <div className="flex items-center bg-neutral-100/80 rounded-xl border border-neutral-200/60 p-1 mx-auto z-10 mb-4 sm:mb-0 shadow-inner-border">
                <a
                  href={year > YEAR_MIN ? yearPath(year - 1) : undefined}
                  aria-disabled={year === YEAR_MIN}
                  onClick={() => year > YEAR_MIN && trackYear(year - 1)}
                  className="p-2 hover:bg-white hover:shadow-xs rounded-lg text-neutral-500 hover:text-brand-600 transition-all duration-200"
                  aria-label="Poprzedni Rok"
                >
                  <ChevronLeft className="w-5 h-5" />
                </a>
                
                <div className="relative mx-2">
                   <select 
                    aria-label="Wybierz rok"
                    value={year} 
                    onChange={handleYearChange}
                    className="appearance-none bg-transparent font-bold text-lg text-neutral-800 py-1 pl-4 pr-8 rounded-md focus:outline-none cursor-pointer hover:bg-black/5 text-center transition-colors"
                   >
                     {yearsRange.map(y => (
                       <option key={y} value={y}>{y}</option>
                     ))}
                   </select>
                   {/* Custom Dropdown Arrow Overlay */}
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                </div>

                <a
                  href={year < YEAR_MAX ? yearPath(year + 1) : undefined}
                  aria-disabled={year === YEAR_MAX}
                  onClick={() => year < YEAR_MAX && trackYear(year + 1)}
                  className="p-2 hover:bg-white hover:shadow-xs rounded-lg text-neutral-500 hover:text-brand-600 transition-all duration-200"
                  aria-label="Następny Rok"
                >
                  <ChevronRight className="w-5 h-5" />
                </a>
              </div>
              


            </div>
          </div>
        </header>

        {/* Cookie Banner moves here inside the sticky container */}
        <CookieBanner />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <nav aria-label="Okruszki" className="text-sm text-neutral-500 mb-5"><a href="/">NieRobie.pl</a> / Kalendarz {year}</nav>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Dni wolne i długie weekendy {year}</h1>
        <p className="text-neutral-600 max-w-3xl mb-6 leading-relaxed">Kalendarz świąt {year} i planer urlopu w Polsce. Sprawdź, kiedy wziąć wolne na majówkę, Boże Ciało i wakacje, aby połączyć urlop z weekendami. <a className="text-brand-700 underline" href="/kalkulator-urlopu/">Policz dni urlopu między datami</a>.</p>
        <nav aria-label="Na tej stronie" className="flex flex-wrap gap-4 text-sm text-brand-700 mb-6"><a href="#kalendarz">Kalendarz {year}</a><a href="#swieta">Święta {year}</a><a href="#planer-urlopu">Kiedy wziąć urlop?</a><a href="#pytania">Pytania i odpowiedzi</a></nav>
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
            <div className="relative w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
          </label>
        </div>

        {/* Dashboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <EfficiencyDisplay 
            efficiencyClass={yearStats.efficiencyClass} 
            year={year} 
            redeemSaturdays={redeemSaturdays}
          />
          <StatsGrid stats={yearStats} globalStats={globalStats} redeemSaturdays={redeemSaturdays} year={year} />
          <HolidayList 
            longWeekendOpportunities={yearStats.longWeekendOpportunities} 
            allHolidays={yearStats.allHolidays}
            redeemSaturdays={redeemSaturdays}
            longWeekendsList={yearStats.longWeekendsList}
            potentialWeekendsList={yearStats.potentialWeekendsList}
            year={year}
          />
        </div>

        {/* Calendar Grid Container */}
        <div id="kalendarz" className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100 scroll-mt-40">
          
          {/* Header Bar */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 pl-1">
             <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Kalendarz {year}</h2>
             <Legend />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-x-2">
            {calendarData.map((month) => (
              <MonthView 
                key={month.monthIndex} 
                month={month} 
                hoveredSequenceId={hoveredSequenceId}
                onHoverSequence={setHoveredSequenceId}
              />
            ))}
          </div>

        </div>
        
        <section id="planer-urlopu" className="scroll-mt-40"><VacationStrategy year={year} precalculatedStrategies={strategies} /></section>

        <SeoContent year={year} strategies={strategies} />
        
        <footer className="mt-12 py-8 border-t border-neutral-100">
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
