# Planer urlopu — zakres i decyzje

Cel: osobisty kalendarz urlopu bez rejestracji, z natychmiastowym wynikiem i lokalnym zapisem.

1. Zastępujemy widok `/kalkulator-urlopu/`, zachowując adres, canonical i intencję SEO „kalkulator dni urlopu”. Strona jest jednocześnie landingiem i narzędziem.
2. Roczny kalendarz zachowuje układ miesięcy strony roku. Kliknięcie dnia roboczego dodaje/usuwa urlop. Weekendy i polskie święta dołączają automatycznie do ciągów. Podsumowanie pokazuje koszt urlopu, sumę rozłącznych przerw i najdłuższy ciąg; nie sumuje nakładających się mostków.
3. Budżet roczny jest ustawiany ręcznie. Zapis w localStorage ma wersjonowany schemat, walidację, obsługę niedostępnej pamięci, cofnięcie ostatniej zmiany i eksport/import JSON. Import scala daty i pozwala cofnąć zmianę. Plan nie jest wysyłany do API ani analityki.
4. Donacje krwi i osocza zapisujemy jako planowane daty. Dzień donacji i kolejny dzień kalendarzowy są zwolnieniem, a nie urlopem; weekend nie przesuwa zwolnienia na poniedziałek. Konflikt z urlopem nie liczy dnia podwójnie. Planer blokuje terminy niezgodne z podstawowymi odstępami i limitami donacji krwi/osocza w ruchomych 12 miesiącach (także przy edycji i imporcie). Nie ustala kwalifikacji medycznej ani wyjątków lekarskich.
5. Tryb uczniowski nakłada ferie województwa i wakacje. Nie zmienia kosztu urlopu osoby pracującej. Brak opublikowanych danych jest jawny. Źródłem jest MEN; JSON ze źródłem i datą weryfikacji nadaje się do przyszłych stron SEO.
6. Build odświeża dane szkolne. Parser waliduje daty, 14-dniowe ferie, wszystkie 16 województw i źródła. Awaria zachowuje ostatnią poprawną kopię; tryb strict zgłasza błąd do crona. Cron zapisuje aktualizacje w repo i uruchamia publikację.
7. CTA przy kalendarzu roku, na każdej karcie strategii (konkretne dni) i na stronie głównej. Wejście ze strategii od razu dodaje konkretne dni, zapisuje je i pokazuje odpowiedni miesiąc, bez nadpisywania planu. Dodanie można cofnąć, a odświeżenie nie dodaje go ponownie.

Weryfikacja: testy obliczeń (święta, granice roku, donacje, deduplikacja), walidacji zapisu/importu i parsera MEN; testy przeglądarkowe zapisu, CTA, trybu uczniowskiego, awarii localStorage i szerokości 320–1440 px; typecheck, build, statyczne SEO i strefy czasowe.


## Korekty UX i donacje

- Hero wyjaśnia działanie kalendarza; hasło: „Wolne nie musi kończyć się w niedzielę”.
- Zwarty panel terminów ferii i wakacji, wybór województwa i skok do miesiąca. Przerwy szkolne mają tylko podkreślenia: błękitne ferie i bursztynowe wakacje, z legendą. Podkreślenie pokrywa dolną krawędź dnia; na urlopie staje się kolorową falą. Kalendarz używa palety widoku roku: liliowe weekendy i obwódki ciągów wolnego, limonkowy urlop z falą. Donacje wyróżnia morski kolor i kropla wewnątrz komórki. Zaznaczanie zbiorczego zakresu dat usunięte.
- Donacje: formularz, edycja/usuwanie, dwa przyciski limitu 4/6 donacji krwi (domyślnie 4, bez deklarowania płci), historia ze wszystkich lat, blokady w kalendarzu z wyjaśnieniem. Import waliduje sumę wpisów, a nie tylko plik. Stare kolidujące wpisy pozostają widoczne do poprawy.
- Źródło reguł: https://eli.gov.pl/eli/DU/2025/756/ogl — załącznik 3, sprawdzone 16.09.2026. Krew–krew: 8 tygodni, krew–osocze: 4 tygodnie, osocze–osocze: 2 tygodnie, osocze–krew: 48 h. Przy tygodniach uwzględniamy dzień pobrania (przesunięcia 55/27/13 dni). Ponieważ brak godzin pobrania, dla 48 h stosujemy zachowawcze 3 dni (4, jeśli zmiana czasu skraca dobę) i wyjaśniamy to w interfejsie. Nie obsługujemy wyjątków lekarskich.
- Limity 4 (kobiety / profil niepodany) lub 6 (mężczyźni) donacji krwi i 33 donacji osocza w ruchomych 12 miesiącach. Wpisy bez podanej płci migrują do limitu 4; profile i terminy pozostają lokalne. Kwalifikacja medyczna, inne metody donacji i parametry objętościowe pozostają po stronie centrum krwiodawstwa.

## Planowanie przez granicę roku

- Pionowe przyciski przy styczniu i grudniu zajmują całą wysokość wiersza. Mają prostą obwódkę oraz małą ikonę kalendarza z numerem miesiąca. Najechanie lub fokus klawiatury odsłania fragment sąsiedniego miesiąca, delikatnie odsuwając kalendarz o 16 px w układzie, bez pływającego podglądu. Kliknięcie rozwija grudzień poprzedniego albo styczeń kolejnego roku i usuwa boczny przycisk. Krzyżyk nachodzący na róg dodatkowego miesiąca zamyka go i przywraca fokus zakładce. Etykieta roku przerywa ramkę własnym tłem, a podsumowanie ma wewnętrzne odstępy. Animacje respektują ograniczenie ruchu. Każda wybieralna data występuje raz; miniatura jest dekoracyjnym podglądem. Zapisane zaznaczenia w tych miesiącach automatycznie je odsłaniają po powrocie; schowanie miesiąca nie zmienia danych.
- Przy podglądzie pionowa zakładka chowa się, a jej miejsce zajmuje fragment miesiąca; kalendarz nadal odsuwa się tylko o 16 px. Rozwinięcie i schowanie płynnie przestawia pozostałe miesiące. Po kliknięciu przewijamy płynnie tylko tyle, ile potrzeba, aby pokazać dodatkowy miesiąc; ograniczenie ruchu wyłącza animacje i płynne przewijanie.
- Dodatkowy miesiąc pokazuje rok i lokalny koszt urlopu obok linku „Cały rok” w jednym wierszu. Na wąskich kafelkach pomijamy powtórzenie roku w stopce (rok pozostaje w nagłówku). Bilans główny zawsze obciąża tylko aktualnie wybrany rok. Osobne liczniki pokazują wykorzystanie puli sąsiednich lat, a przerwy na przełomie lat — rozbicie kosztu urlopu/donacji.
- Łączniki pozostają otwarte na granicach tygodni, miesięcy i lat. Zaokrąglenia występują wyłącznie na rzeczywistych krańcach przerwy.
- Każdy miesiąc korzysta z własnego roku świąt/ferii. Blokady donacji uwzględniają całą zapisaną historię również przy edycji dodatkowego miesiąca.
