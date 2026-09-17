import React, { useEffect, useState } from 'react';
import { getPlanningDate } from './utils/vacationSuggestions';
import { PersonalPlanner } from './components/PersonalPlanner';
import { HomePage } from './components/HomePage';
import App from './App';
import { CookieBanner } from './components/CookieBanner';
import { TodayProvider } from './components/TodayProvider';
import { resolvePage, featuredYears, indexedYears, yearPath, type PageData } from './utils/seo';

function YearLinks({ buildYear }: { buildYear: number }) {
  return <nav aria-label="Kalendarze lat" className="flex flex-wrap gap-3 my-6">{featuredYears(buildYear).map(year => <a key={year} href={yearPath(year)} className="rounded-xl border border-brand-200 bg-white px-5 py-4 text-brand-700 font-semibold hover:bg-brand-50">Dni wolne {year} →</a>)}</nav>;
}
function PageFooter({ buildYear }: { buildYear: number }) {
  return <footer className="mt-12 border-t border-neutral-200 pt-8 text-sm text-neutral-600">
    <nav aria-label="Nawigacja stopki" className="flex flex-wrap gap-x-5 gap-y-3"><a href="/">NieRobie.pl</a><a href="/kalkulator-urlopu/">Mój plan nierobienia</a>{indexedYears(buildYear).map(year => <a href={yearPath(year)} key={year}>Kalendarz {year}</a>)}</nav>
    <p className="mt-6">© {buildYear} NieRobie.pl · <a href="mailto:nierobie@proton.me">nierobie@proton.me</a></p>
  </footer>;
}
export function Site(data: PageData) {
  const page = resolvePage(data.path);
  const [planningDate, setPlanningDate] = useState(data.buildDate ?? `${data.buildYear}-01-01`);
  useEffect(() => { setPlanningDate(getPlanningDate()); }, []);
  const currentYear = Number(planningDate.slice(0, 4));
  if (page.kind === 'year') return <TodayProvider><App year={page.year} buildYear={data.buildYear} /></TodayProvider>;
  return <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-16">
    <header className="site-header"><nav aria-label="Menu główne" className="site-nav max-w-5xl mx-auto px-5"><a href="/" className="site-brand">nierobie<span>.pl</span></a><div className="site-menu"><a className="site-year-cta" href={yearPath(currentYear)}>Wolne {currentYear}<span aria-hidden="true">↗</span></a><a href="/kalkulator-urlopu/" aria-current={page.kind === 'calculator' ? 'page' : undefined}>Mój plan nierobienia <span aria-hidden="true">↗</span></a></div></nav><CookieBanner /></header>
    <main className={`${page.kind === 'calculator' ? 'max-w-7xl' : 'max-w-5xl'} mx-auto px-5 py-10 sm:py-16`}>
      {page.kind === 'home' ? <HomePage currentYear={currentYear} /> : page.kind === 'calculator' ? <PersonalPlanner planningDate={planningDate} /> : <><h1 className="text-4xl font-bold">Nie znaleziono strony</h1><p className="mt-5 text-neutral-600">Sprawdź adres lub wybierz kalendarz dni wolnych.</p><YearLinks buildYear={data.buildYear} /><a href="/" className="text-brand-700 underline">Wróć na stronę główną</a></>}
      <PageFooter buildYear={data.buildYear} />
    </main>
  </div>;
}
