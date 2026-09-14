import React from 'react';
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
  if (page.kind === 'year') return <TodayProvider><App year={page.year} buildYear={data.buildYear} /></TodayProvider>;
  return <div className="min-h-screen bg-neutral-50 text-neutral-900 pb-16">
    <header className="bg-white border-b border-neutral-200"><nav aria-label="Menu główne" className="max-w-5xl mx-auto px-5 py-5 flex flex-wrap gap-5 justify-between"><a href="/" className="text-xl font-bold">NieRobie.pl</a><a href="/kalkulator-urlopu/" className="text-brand-700">Kalkulator urlopu</a></nav><CookieBanner /></header>
    <main className="max-w-5xl mx-auto px-5 py-10 sm:py-16">
      {page.kind === 'home' ? <>
        <p className="text-brand-700 font-semibold mb-4">Mniej urlopu, więcej wolnego</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight max-w-3xl">NieRobie.pl – planer urlopu i dni wolnych</h1>
        <p className="text-lg text-neutral-600 leading-relaxed mt-6 max-w-3xl">Planujesz wakacje lub krótki wyjazd? Sprawdź, jak połączyć urlop ze świętami i weekendami. Wybierz rok, porównaj terminy i zobacz, ile dni wolnego możesz zyskać.</p>
        <YearLinks buildYear={data.buildYear} />
        <a href="/kalkulator-urlopu/" className="inline-block bg-brand-600 text-white font-semibold px-6 py-3 rounded-xl mt-2">Oblicz dni urlopu na wakacje →</a>
        <section className="mt-14 grid sm:grid-cols-3 gap-6">
          {[
            ['Kalendarz dni wolnych', 'Daty polskich świąt oraz układ weekendów w jednym miejscu. Sprawdź także Wigilię, Wielkanoc i Boże Ciało.'],
            ['Długie weekendy', 'Zobacz konkretne dni do wzięcia urlopu, długość wypoczynku i liczbę wykorzystanych dni. Porównaj propozycje w planerze.'],
            ['Kalkulator dni urlopu', 'Wpisz daty wakacji i policz dni robocze, które trzeba pokryć urlopem. Wynik uwzględnia weekendy i polskie święta.']
          ].map(([title, text]) => <div key={title} className="bg-white border border-neutral-200 rounded-2xl p-6"><h2 className="text-xl font-bold mb-3">{title}</h2><p className="text-neutral-600 leading-relaxed">{text}</p></div>)}
        </section>
        <section className="mt-12 max-w-3xl"><h2 className="text-2xl font-bold mb-4">Jak zaplanować wakacje z NieRobie?</h2><ol className="list-decimal pl-6 space-y-3 text-neutral-600"><li>Otwórz kalendarz roku, w którym planujesz wypoczynek.</li><li>Porównaj majówkę, Boże Ciało, lato i przerwę świąteczną w propozycjach urlopu.</li><li>Sprawdź własny termin w kalkulatorze dni urlopu i uzgodnij wolne w pracy.</li></ol></section>
      </> : page.kind === 'calculator' ? <>
        <nav aria-label="Okruszki" className="text-sm text-neutral-500 mb-5"><a href="/">NieRobie.pl</a> / Kalkulator dni urlopu</nav>
        <h1 className="text-4xl font-bold tracking-tight">Kalkulator dni urlopu na wakacje</h1>
        <p className="text-lg text-neutral-600 leading-relaxed mt-5">Wybierz początek i koniec wypoczynku. Kalkulator pokaże, ile dni urlopu potrzebujesz na wyjazd oraz ile z wybranego okresu przypada na weekendy i święta w Polsce.</p>
        <LeaveCalculator buildYear={data.buildYear} />
        <section className="space-y-5 max-w-3xl"><h2 className="text-2xl font-bold">Jak działa kalkulator urlopu?</h2><p className="text-neutral-600 leading-relaxed">Od liczby dni kalendarzowych odejmujemy soboty, niedziele i święta przypadające w dni robocze. Na przykład wypoczynek od poniedziałku do niedzieli w tygodniu bez świąt trwa 7 dni i wymaga 5 dni urlopu.</p><h2 className="text-2xl font-bold">Jak wybrać termin wakacji?</h2><p className="text-neutral-600 leading-relaxed">Porównaj kilka terminów o tej samej długości. Święto przypadające od poniedziałku do piątku może zmniejszyć liczbę potrzebnych dni urlopu. Gotowe propozycje długich weekendów znajdziesz w kalendarzu wybranego roku.</p></section>
        <YearLinks buildYear={data.buildYear} />
        <section className="space-y-4 mt-8"><h2 className="text-2xl font-bold">Pytania o kalkulator wakacji i urlopu</h2>
          <details className="bg-white border rounded-xl p-5"><summary className="font-semibold cursor-pointer">Czy kalkulator oblicza koszt wakacji?</summary><p className="mt-3 text-neutral-600">Liczy czas wypoczynku i potrzebne dni urlopu. Ceny transportu, noclegów i wyżywienia trzeba uwzględnić osobno w budżecie wyjazdu.</p></details>
          <details className="bg-white border rounded-xl p-5"><summary className="font-semibold cursor-pointer">Czy obliczę tutaj przysługujący wymiar urlopu?</summary><p className="mt-3 text-neutral-600">Narzędzie oblicza zużycie dni na konkretny termin. Nie wylicza uprawnień zależnych od stażu pracy, etatu ani urlopu proporcjonalnego.</p></details>
          <details className="bg-white border rounded-xl p-5"><summary className="font-semibold cursor-pointer">Czy wynik uwzględnia Wigilię i święta ruchome?</summary><p className="mt-3 text-neutral-600">Tak. Kalendarz obejmuje Wielkanoc, Poniedziałek Wielkanocny, Zielone Świątki i Boże Ciało, a od 2025 roku także wolną Wigilię.</p></details>
        </section>
      </> : <><h1 className="text-4xl font-bold">Nie znaleziono strony</h1><p className="mt-5 text-neutral-600">Sprawdź adres lub wybierz kalendarz dni wolnych.</p><YearLinks buildYear={data.buildYear} /><a href="/" className="text-brand-700 underline">Wróć na stronę główną</a></>}
      <PageFooter buildYear={data.buildYear} />
    </main>
  </div>;
}
