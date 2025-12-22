import React, { useState, useMemo, useEffect } from 'react';
import { generateCalendarData, getYearStats, getGlobalStatsRange } from './utils/dateUtils';
import { trackEvent, AnalyticsCategory, AnalyticsAction } from './utils/analytics';
import { MonthView } from './components/MonthView';
import { Legend } from './components/Legend';
import { EfficiencyDisplay } from './components/EfficiencyDisplay';
import { StatsGrid } from './components/StatsGrid';
import { HolidayList } from './components/HolidayList';
import { SeoContent } from './components/SeoContent';
import { SeoHead } from './components/SeoHead';
import { ChevronLeft, ChevronRight } from './components/Icons';
// import { VacationStrategy } from './components/VacationStrategy'; // Lazy loaded now
import { CookieBanner } from './components/CookieBanner';
import { analyzeVacationStrategies } from './utils/vacationStrategyUtils'; // Added

// Lazy load heavy component
const VacationStrategy = React.lazy(() => import('./components/VacationStrategy').then(module => ({ default: module.VacationStrategy })));

const App: React.FC = () => {
  // Initialize year from URL path (e.g., /2025) or default to current year
  const getInitialYear = () => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        // Parse path: /2025 -> 2025
        const pathYear = window.location.pathname.replace(/^\//, '');
        if (pathYear) {
          const parsed = parseInt(pathYear, 10);
          if (!isNaN(parsed) && parsed >= 1991 && parsed <= 2099) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse year from URL', e);
    }
    return new Date().getFullYear();
  };

  const [year, setYear] = useState(getInitialYear);
  const [redeemSaturdays, setRedeemSaturdays] = useState(false);
  const [hoveredSequenceId, setHoveredSequenceId] = useState<string | null>(null);

  // Update URL when year changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.history && window.location) {
        const currentPathYear = window.location.pathname.replace(/^\//, '');
        
        if (currentPathYear !== year.toString()) {
           const newPath = `/${year}`;
           window.history.pushState({}, '', newPath);
        }
      }
    } catch (e) {
      console.error('Failed to update URL', e);
    }
  }, [year]);

  const calendarData = useMemo(() => generateCalendarData(year), [year]);
  const strategies = useMemo(() => analyzeVacationStrategies(year), [year]);
  const yearStats = useMemo(() => getYearStats(calendarData, redeemSaturdays), [calendarData, redeemSaturdays]);
  const globalStats = useMemo(() => getGlobalStatsRange(redeemSaturdays), [redeemSaturdays]);

  const handlePrevYear = () => {
    const newYear = year - 1;
    setYear(newYear);
    trackEvent({
      category: AnalyticsCategory.NAVIGATION,
      action: AnalyticsAction.CHANGE_YEAR,
      label: newYear.toString(),
      value: newYear
    });
  };

  const handleNextYear = () => {
    const newYear = year + 1;
    setYear(newYear);
    trackEvent({
      category: AnalyticsCategory.NAVIGATION,
      action: AnalyticsAction.CHANGE_YEAR,
      label: newYear.toString(),
      value: newYear
    });
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value, 10);
    setYear(newYear);
    trackEvent({
      category: AnalyticsCategory.NAVIGATION,
      action: AnalyticsAction.CHANGE_YEAR,
      label: newYear.toString(),
      value: newYear
    });
  };

  // Generate a range of years 1991 - 2099
  const yearsRange = useMemo(() => {
    const range = [];
    for (let i = 1991; i <= 2099; i++) {
      range.push(i);
    }
    return range;
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-20 selection:bg-brand-100 selection:text-brand-900">
      <SeoHead year={year} efficiencyClass={yearStats.efficiencyClass} />
      
      {/* Sticky Top Section */}
      <div className="sticky top-0 z-[100] shadow-xs">
        <header className="bg-canvas-default/90 backdrop-blur-sm border-b border-neutral-200/60 transition-all">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex flex-col sm:flex-row items-center justify-between py-4">
              
              {/* Left: Logo (Positioned absolutely on desktop to allow center to be true center) */}
              <div className="sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-3 mb-4 sm:mb-0">
                {/* Icon removed */}
                <div>
                  <h1 className="text-xl font-bold text-neutral-900 tracking-tight">NieRobie.pl</h1>
                </div>
              </div>

              {/* Center: Year Controls */}
              <div className="flex items-center bg-neutral-100/80 rounded-xl border border-neutral-200/60 p-1 mx-auto z-10 mb-4 sm:mb-0 shadow-inner-border">
                <button 
                  onClick={handlePrevYear}
                  className="p-2 hover:bg-white hover:shadow-xs rounded-lg text-neutral-500 hover:text-brand-600 transition-all duration-200"
                  aria-label="Poprzedni Rok"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="relative mx-2">
                   <select 
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

                <button 
                  onClick={handleNextYear}
                  className="p-2 hover:bg-white hover:shadow-xs rounded-lg text-neutral-500 hover:text-brand-600 transition-all duration-200"
                  aria-label="Następny Rok"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              


            </div>
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
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-neutral-100">
          
          {/* Header Bar */}
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 pl-1">
             <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">{year}</h2>
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
        
        <React.Suspense fallback={<div className="h-96 flex items-center justify-center text-neutral-400">Ładowanie strategii...</div>}>
          <VacationStrategy year={year} precalculatedStrategies={strategies} />
        </React.Suspense>

        <SeoContent year={year} strategies={strategies} />
        
        <footer className="mt-12 py-8 border-t border-neutral-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-neutral-400 text-sm">
              <p>© {new Date().getFullYear()} NieRobie.pl</p>
            </div>

            {/* Internal Linking for SEO */}
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-medium text-neutral-500">
               <span>Szybkie linki:</span>
               <a href="/2024" className="hover:text-brand-600 transition-colors">Kalendarz 2024</a>
               <a href="/2025" className="hover:text-brand-600 transition-colors">Kalendarz 2025</a>
               <a href="/2026" className="hover:text-brand-600 transition-colors">Kalendarz 2026</a>
               <a href="/2027" className="hover:text-brand-600 transition-colors">Kalendarz 2027</a>
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
