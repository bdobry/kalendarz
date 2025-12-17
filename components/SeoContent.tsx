import React from 'react';

export const SeoContent: React.FC = () => {
  return (
    <section className="bg-canvas-default rounded-xl shadow-xs border border-neutral-200/60 p-8 mt-12 mb-8">
      <div className="prose prose-slate max-w-none">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          Jak najlepiej zaplanować urlop i wykorzystać dni wolne od pracy?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 tracking-tight">
              Strategie urlopowe
            </h3>
            <p className="text-neutral-600 mb-4 leading-relaxed">
              Planowanie urlopu z wyprzedzeniem to klucz do maksymalizacji czasu wolnego. 
              Wykorzystując ustawowe dni wolne od pracy, tzw. "czerwone kartki", oraz weekendy, 
              możesz znacząco wydłużyć swój wypoczynek, zużywając przy tym minimalną liczbę dni urlopowych.
              Nasza aplikacja <strong>NieRobie.pl</strong> analizuje kalendarz na dany rok i wskazuje najlepsze okazje do wzięcia urlopu.
            </p>
            <p className="text-slate-600 mb-4 leading-relaxed">
              Pamiętaj, aby zwrócić uwagę na tzw. długie weekendy. Często wystarczy wziąć jeden lub dwa dni urlopu 
              w okolicach świąt takich jak Majówka (1 i 3 maja), Boże Ciało czy Wszystkich Świętych, 
              aby zyskać nawet 9-dniowy wypoczynek.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-neutral-800 mb-3 tracking-tight">
              Dni wolne od pracy w Polsce
            </h3>
            <p className="text-slate-600 mb-4 leading-relaxed">
              W Polsce mamy 13 dni ustawowo wolnych od pracy. Są to m.in. Nowy Rok, Święto Trzech Króli, 
              Wielkanoc, Święto Pracy, Święto Konstytucji 3 Maja, Boże Ciało, Wniebowzięcie NMP, 
              Wszystkich Świętych, Święto Niepodległości oraz Boże Narodzenie.
            </p>
             <p className="text-slate-600 mb-4 leading-relaxed">
              Zgodnie z Kodeksem Pracy, jeśli święto przypada w sobotę, pracodawca ma obowiązek oddać pracownikowi dzień wolny 
              w innym terminie. Nasz kalendarz uwzględnia tę zasadę (opcja "Odbiór za sobotę"), 
              co pozwala na jeszcze dokładniejsze planowanie czasu wolnego.
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-brand-50 rounded-xl border border-brand-100">
          <h4 className="text-brand-900 font-semibold mb-2">Dlaczego warto planować z NieRobie.pl?</h4>
          <p className="text-brand-800 text-sm">
            Nasz algorytm oblicza "Score Wydajności" dla każdego potencjalnego urlopu, biorąc pod uwagę stosunek dni wolnych do zużytych dni urlopowych. 
            Dzięki temu wiesz dokładnie, kiedy wziąć wolne, żeby zyskać jak najwięcej czasu dla siebie i bliskich.
          </p>
        </div>
      </div>
    </section>
  );
};
