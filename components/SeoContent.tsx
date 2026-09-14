import React, { useMemo } from 'react';
import { VacationOpportunity } from '../utils/vacationStrategyUtils';
import { calculateYearCuriosities } from '../utils/statsUtils';
import { generateCalendarData, getPolishHolidays } from '../utils/dateUtils';
import { DayType, MonthData } from '../types';

interface SeoContentProps {
  year: number;
  strategies?: VacationOpportunity[];
}

export const SeoContent: React.FC<SeoContentProps> = ({ year, strategies = [] }) => {
  // Compute dynamic answers
  const majowkaStrategy = useMemo(() => {
    return strategies.find(s => s.description.includes('Majówka') || (s.monthIndex === 4 && s.startDate.getDate() <= 5));
  }, [strategies]);

  const bestStrategies = useMemo(() => {
    return [...strategies].filter(s => s.daysToTake > 0).sort((a, b) => b.efficiency - a.efficiency || a.daysToTake - b.daysToTake).filter((s, i, all) => all.findIndex(other => other.periodName === s.periodName) === i).slice(0, 3);
  }, [strategies]);

  // Compute Curiosities (Ciekawostki)
  const curiosities = useMemo(() => {
     return calculateYearCuriosities(year);
  }, [year]);


  // Check for Nov 1st
  const nov1 = new Date(year, 10, 1);
  const isNov1Sat = nov1.getDay() === 6;

  const holidays = useMemo(() => [...getPolishHolidays(year)].sort(([a], [b]) => a.localeCompare(b)), [year]);
  const easterDate = holidays.find(([, name]) => name === 'Wielkanoc')?.[0];

  return (
    <section className="bg-canvas-default rounded-xl shadow-xs border border-neutral-200/60 p-8 mt-12 mb-8">
      <div className="prose prose-slate max-w-none">
        <section id="swieta" className="scroll-mt-40 mb-10">
          <h2 className="text-2xl font-bold mb-4">Święta i dni ustawowo wolne od pracy {year}</h2>
          <p className="text-neutral-600 mb-4">Daty świąt w Polsce pomagają wybrać termin urlopu. Obliczenia dotyczą standardowego tygodnia pracy od poniedziałku do piątku. Dla przyszłych lat przyjmujemy obecne zasady świąt; terminy warto sprawdzić ponownie przed wyjazdem.</p>
          <div className="overflow-x-auto"><table className="w-full text-sm text-left border-collapse">
            <caption className="sr-only">Kalendarz świąt w Polsce na {year} rok</caption>
            <thead><tr className="border-b border-neutral-200"><th scope="col" className="p-3">Data</th><th scope="col" className="p-3">Dzień tygodnia</th><th scope="col" className="p-3">Święto</th></tr></thead>
            <tbody>{holidays.map(([date, name]) => {
              const [y, m, d] = date.split('-').map(Number);
              const day = new Date(y, m - 1, d);
              return <tr key={date} className="border-b border-neutral-100"><td className="p-3 whitespace-nowrap"><time dateTime={date}>{day.toLocaleDateString('pl-PL')}</time></td><td className="p-3">{day.toLocaleDateString('pl-PL', { weekday: 'long' })}</td><th scope="row" className="p-3 font-medium">{name}</th></tr>;
            })}</tbody>
          </table></div>
          <p className="text-xs text-neutral-500 mt-4">Wigilia jest dniem ustawowo wolnym od 2025 roku. <a className="underline" href="https://www.pip.gov.pl/aktualnosci/wigilia-bozego-narodzenia-dniem-wolnym-od-pracy-przepisy-wlasnie-weszly-w-zycie">Źródło: Państwowa Inspekcja Pracy</a>.</p>
        </section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Jak najlepiej zaplanować urlop w {year} roku?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 tracking-tight">
              Strategie urlopowe {year}
            </h3>
            <p className="text-neutral-600 mb-4 leading-relaxed">
              Planowanie urlopu z wyprzedzeniem to klucz do maksymalizacji czasu wolnego w {year} roku. 
              Wykorzystując ustawowe dni wolne od pracy, tzw. "czerwone kartki", oraz weekendy, 
              możesz znacząco wydłużyć swój wypoczynek, zużywając przy tym minimalną liczbę dni urlopowych.
              Nasza aplikacja <strong>NieRobie.pl</strong> analizuje kalendarz na dany rok i wskazuje najlepsze okazje do wzięcia urlopu.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Pamiętaj, aby zwrócić uwagę na tzw. "mostki" (dni pomiędzy świętami a weekendami). 
              Wzięcie urlopu w te dni często pozwala na uzyskanie długiego weekendu przy minimalnym koszcie dni urlopowych.
            </p>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-100">
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 tracking-tight">
              Dlaczego warto planować urlop z wyprzedzeniem?
            </h3>
            <ul className="list-disc list-inside space-y-2 text-neutral-600">
              <li>Lepsze ceny lotów i hoteli przy rezerwacji z wyprzedzeniem.</li>
              <li>Większa szansa na akceptację wniosku urlopowego przez pracodawcę.</li>
              <li>Możliwość lepszego skoordynowania planów z rodziną i znajomymi.</li>
              <li>Spokój ducha i unikanie stresu związanego z last minute.</li>
              <li>Maksymalizacja liczby dni wolnych poprzez strategiczne wykorzystanie świąt.</li>
            </ul>
          </div>
        </div>

        <section className="my-8">
          <h3 className="text-xl font-bold mb-3">Wakacje {year} – ile dni urlopu zaplanować?</h3>
          <p className="text-neutral-600 leading-relaxed">Dwutygodniowy wyjazd w okresie bez świąt obejmuje zwykle 10 dni roboczych. Przesunięcie początku lub końca wypoczynku może pozwolić połączyć go z dniem ustawowo wolnym. <a href="/kalkulator-urlopu/" className="text-brand-700 underline">Kalkulator dni urlopu na wakacje</a> przeliczy Twój termin. Propozycje powyżej pokazują też, kiedy wziąć urlop na majówkę {year} i Boże Ciało {year}.</p>
        </section>
        {/* Ciekawostki Section */}
        <div className="mt-8 mb-8">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 tracking-tight">
                📅 Ciekawostki kalendarzowe roku {year}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm col-span-1 sm:col-span-2 md:col-span-1">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Najdłuższy post świąteczny</div>
                    <div className="text-2xl font-bold text-indigo-600">{curiosities.maxDrought} dni</div>
                    <div className="text-xs text-slate-400 mt-1">Bez ustawowych świąt ({curiosities.maxDroughtMonth})</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Najbardziej leniwy miesiąc</div>
                    <div className="text-xl font-bold text-indigo-600 truncate" title={curiosities.lazyMonthNames.join(', ')}>
                         {curiosities.lazyMonthNames.length > 2 
                             ? `${curiosities.lazyMonthNames[0]} i ${curiosities.lazyMonthNames.length - 1} inne` 
                             : curiosities.lazyMonthNames.join(' i ')
                         }
                    </div>
                    <div className="text-xs text-slate-400 mt-1">Aż {curiosities.maxFreeDays} dni wolnych!</div>
                </div>
                
                {/* New Stats */}
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                     <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Klasa Efektywności {year}</div>
                     <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-600">{curiosities.efficiencyClass}</span>
                        {curiosities.efficiencyClass === 'A' && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Super!</span>}
                     </div>
                     <div className="text-xs text-slate-400 mt-1">
                        {curiosities.longWeekendsCount} długich weekendów
                     </div>
                </div>

                {curiosities.holidaysOnSaturday > 0 && (
                     <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Dni do odzyskania</div>
                        <div className="text-2xl font-bold text-indigo-600">{curiosities.holidaysOnSaturday}</div>
                        <div className="text-xs text-slate-400 mt-1">Za święta w sobotę</div>
                    </div>
                )}
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Wigilia {year}</div>
                    <div className="text-xl font-bold text-indigo-600 capitalize">{curiosities.wigiliaDay}</div>
                    <div className="text-xs text-slate-400 mt-1">{year >= 2025 ? 'Dzień wolny od pracy' : 'Dzień pracujący'}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Rok przestępny?</div>
                    <div className="text-xl font-bold text-indigo-600">{curiosities.isLeap ? 'TAK' : 'NIE'}</div>
                    <div className="text-xs text-slate-400 mt-1">{curiosities.isLeap ? '366 dni w roku' : '365 dni w roku'}</div>
                </div>
            </div>

            {/* Chart moved to tile */}
        </div>

        <div className="mt-6 p-4 bg-brand-50 rounded-xl border border-brand-100">
          <h4 className="text-brand-900 font-semibold mb-2">Dlaczego warto planować z NieRobie.pl?</h4>
          <p className="text-brand-800 text-sm">
            Nasz algorytm oblicza "Score Wydajności" dla każdego potencjalnego urlopu w roku {year}, biorąc pod uwagę stosunek dni wolnych do zużytych dni urlopowych. 
            Dzięki temu wiesz dokładnie, kiedy wziąć wolne, żeby zyskać jak najwięcej czasu dla siebie i bliskich.
          </p>
        </div>
        <div id="pytania" className="mt-8 scroll-mt-40">
            <h3 className="text-lg font-semibold text-neutral-800 mb-4 tracking-tight">
              Częste pytania o urlop {year} (FAQ)
            </h3>
            <div className="space-y-4">
              <details className="group bg-white rounded-lg border border-neutral-200/60 open:ring-1 open:ring-indigo-100">
                <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                  <span>Kiedy najlepiej wziąć urlop w {year} roku?</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </summary>
                <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">
                  {bestStrategies.length > 0 ? (
                    <>
                      W {year} roku najlepsze okazje to:
                      <ul className="list-disc list-inside mt-2 ml-2">
                        {bestStrategies.map(s => (
                           <li key={s.id}>
                             <strong>{s.description || 'Długi weekend'}</strong>: Weź {s.daysToTake} dni urlopu: {s.vacationDays.map(date => date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })).join(', ')}. Zyskasz {s.freeDays} dni wolnego od {s.startDate.toLocaleDateString('pl-PL')} do {s.endDate.toLocaleDateString('pl-PL')}.
                           </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    `Najlepsze okazje w ${year} roku to Majówka, Boże Ciało oraz okres świąteczno-noworoczny. Sprawdź powyższą sekcję "Strategia urlopowa".`
                  )}
                </div>
              </details>

              <details className="group bg-white rounded-lg border border-neutral-200/60 open:ring-1 open:ring-indigo-100">
                <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                  <span>Ile dni wolnego na Majówkę {year}?</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </summary>
                <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">
                   {majowkaStrategy ? (
                      <>
                        W {year} roku Majówka to: 1 maja - <strong>{new Date(year, 4, 1).toLocaleDateString('pl-PL', {weekday: 'long'})}</strong> a 3 maja - <strong>{new Date(year, 4, 3).toLocaleDateString('pl-PL', {weekday: 'long'})}</strong>. 
                        Biorąc {majowkaStrategy.daysToTake} dni urlopu, zyskujesz aż {majowkaStrategy.freeDays} dni nieprzerwanego wypoczynku ({majowkaStrategy.startDate.toLocaleDateString('pl-PL')} - {majowkaStrategy.endDate.toLocaleDateString('pl-PL')}).
                      </>
                   ) : (
                      <>
                        W {year} roku Majówka (1 maja - <strong>{new Date(year, 4, 1).toLocaleDateString('pl-PL', {weekday: 'long'})}</strong>, 3 maja - <strong>{new Date(year, 4, 3).toLocaleDateString('pl-PL', {weekday: 'long'})}</strong>) może wymagać dobrania kilku dni urlopu. Sprawdź kalendarz powyżej, aby znaleźć najlepszą kombinację.
                      </>
                   )}
                </div>
              </details>

              <details className="group bg-white rounded-lg border border-neutral-200/60 open:ring-1 open:ring-indigo-100">
                  <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                    <span>Czy rok {year} jest przestępny?</span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </summary>
                  <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">
                     {curiosities.isLeap 
                         ? `Tak, rok ${year} jest rokiem przestępnym i ma 366 dni (luty ma 29 dni).` 
                         : `Nie, rok ${year} nie jest rokiem przestępnym i ma standardowo 365 dni.`
                     }
                  </div>
              </details>

              <details className="group bg-white rounded-lg border border-neutral-200/60 open:ring-1 open:ring-indigo-100">
                <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                  <span>Czy 1 listopada {year} jest dniem wolnym?</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </span>
                </summary>
                <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">
                  Tak, 1 listopada (Wszystkich Świętych) jest dniem ustawowo wolnym. 
                  {isNov1Sat 
                    ? ` W ${year} roku wypada w sobotę, co przy standardowej pracy od poniedziałku do piątku oznacza dodatkowy dzień wolny w tym samym okresie rozliczeniowym. Termin odbioru ustala pracodawca.`
                    : ` W ${year} roku wypada w ${nov1.toLocaleDateString('pl-PL', {weekday: 'long'})}, więc jest to standardowy dzień wolny.`
                  }
                </div>
              </details>

              {easterDate && (
                  <details className="group bg-white rounded-lg border border-neutral-200/60 open:ring-1 open:ring-indigo-100">
                    <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                      <span>Kiedy wypadają Święta Wielkanocne w {year} roku?</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">
                       Wielkanoc w {year} roku wypada w dniach: 
                       <ul className="list-disc list-inside mt-2 ml-2">
                           {/* Easter is always Sun+Mon. If we found a strategy, it likely starts close to Easter or includes it. 
                               But strategies are broad. Let's just use the known Easter date from DateUtils if I had it.
                               Wait, I can re-calculate Easter here easily or just trust the strategy start date if it's accurate?
                               Strategy might include the Saturday before.
                               Actually, let's just use the strategy date as a hint or calculate it?
                               I can import `generateCalendarData` which calculates Easter internally but doesn't export it easily.
                               Actually, `generateCalendarData` returns complete days. I can find "Wielkanoc" in the days!
                               */}
                            {(() => {
                                const mData = generateCalendarData(year);
                                const easterSun = mData.flatMap(m => m.weeks.flatMap(w => w)).find(d => d.holidayName?.includes('Wielkanoc') && d.date.getDay() === 0);
                                if (easterSun) {
                                    const mon = new Date(easterSun.date);
                                    mon.setDate(mon.getDate() + 1);
                                    return (
                                        <>
                                            <li><strong>{easterSun.date.toLocaleDateString('pl-PL', {day:'numeric', month:'long'})}</strong> (Niedziela Wielkanocna)</li>
                                            <li><strong>{mon.toLocaleDateString('pl-PL', {day:'numeric', month:'long'})}</strong> (Poniedziałek Wielkanocny)</li>
                                        </>
                                    )
                                }
                                return <li>Dane niedostępne</li>
                            })()}
                       </ul>
                       <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic">
                           Ciekawostka: Wielkanoc jest świętem ruchomym i może wypaść najwcześniej <strong>22 marca</strong>, a najpóźniej <strong>25 kwietnia</strong>.
                       </p>
                    </div>
                  </details>
              )}

                 <details className="group bg-white rounded-lg border border-neutral-200/60 open:ring-1 open:ring-indigo-100">
                    <summary className="flex items-center justify-between p-4 cursor-pointer font-medium text-slate-700 hover:text-indigo-600 transition-colors">
                      <span>Ile jest dni pracujących w {year} roku?</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </span>
                    </summary>
                    <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">
                       {(() => {
                           const { workingDaysCount, freeDaysCount, holidaysOnSaturday } = curiosities;
                           const realWorking = workingDaysCount - holidaysOnSaturday;
                           
                           return (
                               <>
                                 W {year} roku mamy standardowo <strong>{workingDaysCount}</strong> dni pracujących oraz <strong>{freeDaysCount}</strong> dni wolnych od pracy (weekendy i święta).
                                 {holidaysOnSaturday > 0 && (
                                     <div className="mt-2 text-indigo-600 bg-indigo-50 p-2 rounded border border-indigo-100">
                                         Dodatkowo, <strong>{holidaysOnSaturday}</strong> {holidaysOnSaturday === 1 ? 'święto wypada' : 'święta wypadają'} w sobotę, co obniża wymiar pracy do <strong>{realWorking}</strong> dni!
                                     </div>
                                 )}
                               </>
                           );
                       })()}
                    </div>
                  </details>

            </div>
        </div>

      </div>
    </section>
  );
};
