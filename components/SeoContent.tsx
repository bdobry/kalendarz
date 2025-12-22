import React, { useMemo } from 'react';
import { VacationOpportunity } from '../utils/vacationStrategyUtils';

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
    return strategies.filter(s => s.recommendationRating === 'BEST' || s.efficiency >= 3.0).slice(0, 3);
  }, [strategies]);

  // Check for Nov 1st
  const nov1 = new Date(year, 10, 1);
  const isNov1Sat = nov1.getDay() === 6;

  return (
    <section className="bg-canvas-default rounded-xl shadow-xs border border-neutral-200/60 p-8 mt-12 mb-8">
      <div className="prose prose-slate max-w-none">
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

        <div className="mt-6 p-4 bg-brand-50 rounded-xl border border-brand-100">
          <h4 className="text-brand-900 font-semibold mb-2">Dlaczego warto planować z NieRobie.pl?</h4>
          <p className="text-brand-800 text-sm">
            Nasz algorytm oblicza "Score Wydajności" dla każdego potencjalnego urlopu w roku {year}, biorąc pod uwagę stosunek dni wolnych do zużytych dni urlopowych. 
            Dzięki temu wiesz dokładnie, kiedy wziąć wolne, żeby zyskać jak najwięcej czasu dla siebie i bliskich.
          </p>
        </div>
        <div className="mt-8">
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
                             <strong>{s.description || 'Długi weekend'}</strong>: Weź {s.daysToTake} dni urlopu ({s.startDate.toLocaleDateString('pl-PL', {day:'numeric', month:'long'})}), aby mieć {s.freeDays} dni wolnego!
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
                      `W ${year} roku Majówka wypada korzystnie. Biorąc ${majowkaStrategy.daysToTake} dni urlopu, zyskujesz aż ${majowkaStrategy.freeDays} dni nieprzerwanego wypoczynku (${majowkaStrategy.startDate.toLocaleDateString('pl-PL')} - ${majowkaStrategy.endDate.toLocaleDateString('pl-PL')}).`
                   ) : (
                      `W ${year} roku Majówka może wymagać dobrania kilku dni urlopu. Sprawdź kalendarz powyżej, aby znaleźć najlepszą kombinację.`
                   )}
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
                    ? ` W ${year} roku wypada w sobotę, co oznacza, że pracodawca ma obowiązek oddać Ci za ten dzień inny dzień wolny (tzw. odbiór za sobotę).`
                    : ` W ${year} roku wypada w ${nov1.toLocaleDateString('pl-PL', {weekday: 'long'})}, więc jest to standardowy dzień wolny.`
                  }
                </div>
              </details>
            </div>
        </div>

      </div>
    </section>
  );
};
