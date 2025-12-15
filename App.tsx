import React, { useState, useMemo, useEffect } from 'react';
import { generateCalendarData, getYearStats, getGlobalStatsRange } from './utils/dateUtils';
import { MonthView } from './components/MonthView';
import { Legend } from './components/Legend';
import { EfficiencyDisplay } from './components/EfficiencyDisplay';
import { StatsGrid } from './components/StatsGrid';
import { HolidayList } from './components/HolidayList';
import { ChevronLeft, ChevronRight, CalendarIcon } from './components/Icons';

const App: React.FC = () => {
  // Initialize year from URL or default to current year
  const getInitialYear = () => {
    try {
      if (typeof window !== 'undefined' && window.location) {
        const params = new URLSearchParams(window.location.search);
        const urlYear = params.get('year');
        if (urlYear) {
          const parsed = parseInt(urlYear, 10);
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

  // Update URL when year changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.history && window.location) {
        const params = new URLSearchParams(window.location.search);
        const currentUrlYear = params.get('year');
        
        if (currentUrlYear !== year.toString()) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('year', year.toString());
          window.history.replaceState({}, '', newUrl.toString());
        }
      }
    } catch (e) {
      console.error('Failed to update URL', e);
    }
  }, [year]);

  const calendarData = useMemo(() => generateCalendarData(year), [year]);
  const yearStats = useMemo(() => getYearStats(calendarData, redeemSaturdays), [calendarData, redeemSaturdays]);
  const globalStats = useMemo(() => getGlobalStatsRange(redeemSaturdays), [redeemSaturdays]);

  const handlePrevYear = () => setYear(y => y - 1);
  const handleNextYear = () => setYear(y => y + 1);
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setYear(parseInt(e.target.value, 10));
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Sticky Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex flex-col sm:flex-row items-center justify-between py-4">
            
            {/* Left: Logo (Positioned absolutely on desktop to allow center to be true center) */}
            <div className="sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-3 mb-4 sm:mb-0">
              {/* Icon removed */}
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">nierobie.pl</h1>
              </div>
            </div>

            {/* Center: Year Controls */}
            <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1 mx-auto z-10">
              <button 
                onClick={handlePrevYear}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                aria-label="Poprzedni Rok"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="relative mx-2">
                 <select 
                  value={year} 
                  onChange={handleYearChange}
                  className="appearance-none bg-transparent font-bold text-lg text-slate-800 py-1 pl-4 pr-8 rounded-md focus:outline-none cursor-pointer hover:bg-slate-50 text-center"
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
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-indigo-600 transition-colors"
                aria-label="Następny Rok"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Right: Settings Toggle */}
            <div className="sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-3">
              <label className="inline-flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={redeemSaturdays} 
                  onChange={(e) => setRedeemSaturdays(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="flex flex-col items-end mr-3">
                    <span className="text-xs font-bold text-slate-700">Odbiór za sobotę</span>
                    <span className="text-[10px] text-slate-400">Dla niektórych UoP*</span>
                </div>
                <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <EfficiencyDisplay 
            efficiencyClass={yearStats.efficiencyClass} 
            year={year} 
            redeemSaturdays={redeemSaturdays}
          />
          <StatsGrid stats={yearStats} globalStats={globalStats} redeemSaturdays={redeemSaturdays} />
          <HolidayList 
            longWeekendOpportunities={yearStats.longWeekendOpportunities} 
            allHolidays={yearStats.allHolidays}
            redeemSaturdays={redeemSaturdays}
          />
        </div>

        {/* Stats / Info Bar - Replaced by Dashboard, but kept as simple header for grid */}
        <div className="mb-6 flex items-center gap-2">
           <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
           <h2 className="text-xl font-bold text-slate-800">Kalendarz {year}</h2>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {calendarData.map((month) => (
            <MonthView key={month.monthIndex} month={month} />
          ))}
        </div>

        <Legend />
        
        <footer className="mt-12 text-center text-slate-400 text-sm">
          <p>© 2025 nierobie.pl</p>
        </footer>
      </main>
    </div>
  );
};

export default App;
