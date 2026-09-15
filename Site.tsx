import React, { useEffect, useState } from 'react';
import { getPlanningDate } from './utils/vacationSuggestions';
import { CalculatorFaq } from './components/CalculatorFaq';
import { HomePage } from './components/HomePage';
import App from './App';
import { CookieBanner } from './components/CookieBanner';
import { TodayProvider } from './components/TodayProvider';
import { LeaveCalculator } from './components/LeaveCalculator';
import { resolvePage, featuredYears, indexedYears, yearPath, type PageData } from './utils/seo';

function YearLinks({ buildYear }: { buildYear: number }) {
  return <nav aria-label="Kalendarze lat" className="flex flex-wrap gap-3 my-6">{featuredYears(buildYear).map(year => <a key={year} href={yearPath(year)} className="rounded-xl border border-brand-200 bg-white px-5 py-4 text-brand-700 font-semibold hover:bg-brand-50">Dni wolne {year} →</a>)}</nav>;
}
function PageFooter({ buildYear }: { buildYear: number }) {
  return <footer className="mt-12 border-t border-neutral-200 pt-8 text-sm text-neutral-600">
    <nav aria-label="Nawigacja stopki" className="flex flex-wrap gap-x-5 gap-y-3"><a href="/">NieRobie.pl</a><a href="/kalkulator-urlopu/">Kalkulator urlopu</a>{indexedYears(buildYear).map(year => <a href={yearPath(year)} key={year}>Kalendarz {year}</a>)}</nav>
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
    <header className="site-header"><nav aria-label="Menu główne" className="site-nav max-w-5xl mx-auto px-5"><a href="/" className="site-brand">nierobie<span>.pl</span></a><div className="site-menu"><a href={yearPath(currentYear)}>Kalendarz {currentYear}</a><a href="/kalkulator-urlopu/" aria-current={page.kind === 'calculator' ? 'page' : undefined}>Kalkulator urlopu <span aria-hidden="true">↗</span></a></div></nav><CookieBanner /></header>
    <main className="max-w-5xl mx-auto px-5 py-10 sm:py-16">
      {page.kind === 'home' ? <HomePage currentYear={currentYear} /> : page.kind === 'calculator' ? <>
        <div className="leave-hero">
          <p className="leave-eyebrow">KALKULATOR DNI URLOPU <span aria-hidden="true">/</span> NIEROBIE.PL</p>
          <h1>Nie robię.<br /><span>To się opłaca.</span></h1>
          <p>Urlop bierz z głową. Resztę niech zrobią weekendy i święta. Policz dni wolnego albo wybierz gotowy plan na nierobienie w {currentYear} roku.</p>
          <span className="leave-hero-sticker" aria-hidden="true">NIE ROBIĘ<br />LICZĘ WOLNE</span>
        </div>
        <LeaveCalculator planningDate={planningDate} />
        <CalculatorFaq />
      </> : <><h1 className="text-4xl font-bold">Nie znaleziono strony</h1><p className="mt-5 text-neutral-600">Sprawdź adres lub wybierz kalendarz dni wolnych.</p><YearLinks buildYear={data.buildYear} /><a href="/" className="text-brand-700 underline">Wróć na stronę główną</a></>}
      <PageFooter buildYear={data.buildYear} />
    </main>
  </div>;
}
