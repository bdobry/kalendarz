# nierobie.pl — SEO, produkt i możliwości biznesowe

**Stan badania: 15 września 2026.** Analiza publicznej aplikacji, bieżącego kodu, wyników wyszukiwania, konkurencji oraz dokumentacji dostawców. Uwzględnia informację właściciela: ruch jest niemal zerowy, a SEO zostało dopiero naprawione.

## 1. Rekomendacja w skrócie

**Rozwijać nierobie.pl jako najprzyjemniejszy sposób na zamianę kilku dni urlopu w konkretny plan odpoczynku.** Przewagę budować przez użyteczność, charakter marki i własne obliczenia. Podstawowy produkt pozostaje darmowy i działa bez konta.

Trzy uzupełniające się kierunki:

1. **Pozyskiwanie użytkowników:** mocne roczniki, kilka naprawdę użytecznych stron sezonowych, oryginalny „Indeks Nierobienia” i materiały, które inni chcą cytować.
2. **Powroty i polecenia:** zapis własnego planu, udostępnianie, wygodny eksport, roczny kalendarz do subskrypcji.
3. **Przychód:** kontekstowa afiliacja po wybraniu terminu; równolegle gotowe pakiety dla firm, które można sprzedawać również przy małym ruchu.

Najbliższe wdrożenia: poprawny eksport → pomiar użycia → szybszy wybór terminu na telefonie → zapis i udostępnianie → strony na listopad/grudzień 2026 i planowanie 2027 → pierwszy raport i próba dystrybucji.

Nie należy wdrażać wszystkich poniższych pomysłów jednocześnie. To katalog możliwości z kolejnością i warunkami uruchomienia.

### Co jest faktem, a co hipotezą

- **Potwierdzone:** działanie publicznych adresów opisanych niżej, elementy interfejsu, obecny kod, odtworzony błąd eksportu, opublikowane zasady dostawców.
- **Hipotezy:** potencjał fraz, przewaga poszczególnych funkcji, gotowość do płacenia i skuteczność kanałów. Wymagają sprawdzenia na użytkownikach.
- Nie mam danych konta Search Console, wolumenów Keyword Plannera, przychodów ani pełnego profilu linków. Obecność stron konkurencji w wynikach nie jest pomiarem ich ruchu ani udziału w rynku. Brak wyników dla prób `site:nierobie.pl` nie dowodzi braku indeksacji.
- Nie mierzyłem rzeczywistych Core Web Vitals użytkowników. Rozmiary plików poniżej dotyczą istniejącego lokalnego buildu, a nie pomiaru transferu produkcyjnego.
- Badanie nie zmienia kodu aplikacji ani hostingu i nie obejmuje wysyłania wiadomości do partnerów.

## 2. Co już działa i co warto chronić

| Zaleta | Dlaczego ma znaczenie | Jak ją wykorzystać |
| --- | --- | --- |
| Krótka, zapamiętywalna polska marka | „Nie robię” ma naturalny język do postów, rekomendacji i rozmowy | Spójne podpisy planów, statusy, grafiki i raporty |
| Humor towarzyszący realnej korzyści | Użytkownik dostaje konkretne daty, a nie sam żart | Zachować zabawne nagłówki i precyzyjne liczby oraz etykiety |
| Wyrazisty wygląd: limonka, fiolet, grafit, stemple | Materiały marki można rozpoznać poza stroną | Jeden zestaw szablonów dla aplikacji, kart i PDF |
| Własny silnik obliczeń | Można porównywać koszt urlopu, długość przerwy i układ lat | Wyniki pod personalizację, treści SEO, raporty i widget |
| „Klasa Efektywności Świątecznej” | Daje prostą opowieść o roku i powód do dyskusji | Rozwinąć w transparentny indeks oraz coroczną publikację |
| Strategie, filtry i konkretne dni do wniosku | Pomagają podjąć decyzję, której sama tabela świąt nie podejmuje | Wyeksponować wynik i dalszą akcję |
| Brak konta i backendu aplikacyjnego | Małe tarcie dla użytkownika i mało obsługi dla właściciela | Zachować tę zasadę także przy zapisie planu |
| Gotowy statyczny HTML i testy | Solidna baza pod widoczność i tanie skalowanie | Rozbudowywać istniejący generator, bez przepisywania stosu |
| Google Calendar i ICS już istnieją | Produkt ma zaczątek przejścia od oglądania do działania | Naprawić i ujednolicić eksport; nie traktować go jako funkcji do budowy od zera |

Najważniejsza grupa: osoba pracująca zwykle od poniedziałku do piątku, która chce szybko ustalić, kiedy wziąć urlop. Kolejna naturalna grupa to rodzice planujący wokół ferii. Firmy i wydawcy to odbiorcy materiałów oraz integracji, nie powód do zamiany głównej aplikacji w system kadrowy.

### Obecny stan SEO na produkcji

Uruchomiony 15.09.2026 skrypt `scripts/check-live-seo.mjs` zakończył się sukcesem:

- `/`, `/2026/`, `/2027/`, `/kalkulator-urlopu/`: HTTP 200, canonical, H1 w odpowiedzi HTML, indeksowanie dozwolone.
- Warianty bez końcowego ukośnika: trwałe przekierowania do odpowiednich adresów z ukośnikiem.
- Nieistniejąca ścieżka: prawdziwe 404 i `noindex`.
- Sitemap: HTTP 200, obecny rocznik 2027.

Kod generuje 112 stron: główna, kalkulator, 109 roczników i 404. Przy roku buildu 2026 indeksowalne są główna, kalkulator i roczniki 2024–2031, razem 10 adresów. Pozostałe roczniki mają `noindex, follow`. Tej polityki nie rozszerzałbym teraz na cały zakres 1991–2099.

**Wniosek:** pierwotna przeszkoda techniczna została usunięta. Teraz potrzebne są odkrywanie stron, ponowny crawl, ocena przez Google i sygnały rzeczywistej wartości. Działający HTML nie potwierdza jeszcze indeksacji ani pozycji.

Dowody w repo: [SEO i generowanie metadanych](/Users/bdobry/Projects/kalendarz/utils/seo.ts), [kontrola produkcji](/Users/bdobry/Projects/kalendarz/scripts/check-live-seo.mjs), [wcześniejsza dokumentacja SEO](/Users/bdobry/Projects/kalendarz/docs/SEO.md). Publiczne widoki: [główna](https://nierobie.pl/), [2027](https://nierobie.pl/2027/), [kalkulator](https://nierobie.pl/kalkulator-urlopu/).

## 3. Konkretne rzeczy do poprawy przed wzrostem

### 3.1. Eksport potrafi przesunąć wypoczynek o dzień — wysoki priorytet

Funkcja formatująca datę używa `toISOString()`, czyli UTC, chociaż strategie korzystają z lokalnych dat kalendarzowych. Odtworzenie w `TZ=Europe/Warsaw` dla 27–30 maja 2027 dało:

```text
Google dates: 20270526/20270530
ICS DTSTART: 20270526
ICS DTEND:   20270530
```

To oznacza 26–29 maja, bo koniec wydarzenia całodniowego jest wyłączny. Poprawnie: początek `20270527`, koniec `20270531`. Obecne testy konstruują daty o północy UTC, przez co nie pokrywają tej ścieżki.

Problem potwierdziłem również na rzeczywistym wyniku `analyzeVacationStrategies(2027)`: strategia `2027-01-01_2027-01-06` eksportuje `20261231/20270106`, czyli 31 grudnia–5 stycznia zamiast 1–6 stycznia. Wszystkie cztery przykłady z sekcji 5.3 dodatkowo przeliczyłem bieżącą funkcją `calculateLeave()`; wyniki są zgodne z opisem.

Przy tej samej poprawce należy obsłużyć tekst ICS: nowe linie, przecinki, średniki, backslash, zakończenia CRLF i zawijanie długich linii. Obecny wieloliniowy opis trafia do pliku bez escapowania. Źródła: [kod eksportu](/Users/bdobry/Projects/kalendarz/utils/calendarExportUtils.ts:9), [wywołanie w strategii](/Users/bdobry/Projects/kalendarz/components/VacationStrategy.tsx:271), [iCalendar RFC 5545](https://www.rfc-editor.org/info/rfc5545/).

Kryterium odbioru: te same zamierzone dni po eksporcie w Warszawie, UTC i strefie amerykańskiej; osobno wydarzenie wypoczynku i opcjonalnie rzeczywiste dni urlopu. Import pliku sprawdzony w kalendarzu, a testy obejmują zmianę czasu i granicę roku.

### 3.2. Na telefonie użyteczna decyzja pojawia się późno

W publicznym widoku `/2027/`, przy 390 × 844 px i bez banera zgody, początki nagłówków były na wysokości:

- Klasa efektywności: 166 px.
- Bilans: 650 px.
- Strategia urlopowa: 1134 px.
- Kalendarz: 1630 px.

To obserwacja interfejsu, nie wynik badania konwersji. Proponuję krótki wybór „Mam 1 / 2 / 5 dni” albo jedną najbliższą okazję nad trzema panelami na telefonie. Charakterystyczną klasę roku zachować. Nie trzeba przebudowywać całego rocznika.

### 3.3. Wynik kalkulatora nie prowadzi jeszcze do trwałego planu

W kalkulatorze są daty, wynik i propozycje. Nie ma tam równoważnej, łatwej ścieżki: zapisz → udostępnij → dodaj do kalendarza. W roczniku eksport jest schowany w rozwiniętych szczegółach. Wspólny pasek działań pod wynikiem to dobry pierwszy projekt produktowy.

### 3.4. Pomiar pokazuje interakcje, ale słabiej pokazuje osiągnięty cel

Kod śledzi m.in. zmianę roku, rozwijanie strategii i najechania. Brakuje pełnego, spójnego lejka obejmującego samodzielnie wybrany wynik kalkulatora, zapis, eksport i polecenie.

Domyślnie wyświetlonego obliczenia nie liczyć jako sukcesu. Zaproponowane zdarzenia:

`plan_selected`, `plan_saved`, `calendar_export`, `share_clicked`, `print_download`, `partner_click`.

Zdarzenia powinny dotyczyć świadomego działania. Raportować źródło wejścia, rocznik, rodzaj okazji i przedział kosztu urlopu. Nazwisk, treści wiadomości i danych pracodawcy nie wysyłać do analityki. Zachować obsługę zgód. Eksport nie oznacza jeszcze faktycznego wykorzystania urlopu.

### 3.5. Wydajność ma konkretną ścieżkę poprawy

Istniejący lokalny build: JS 346 905 B / 99 970 B po gzip, CSS 72 914 B / 14 213 B po gzip; HTML rocznika 2027 około 595 kB / 26 kB po gzip. Duży HTML dobrze się kompresuje, ale nadal trzeba go sparsować i obsłużyć jako DOM.

`getGlobalStatsRange()` i `EfficiencyDisplay` osobno przeliczają lata 1991–2099. Statyczna strona główna importuje też aplikację rocznika do wspólnego pakietu. Propozycje: preobliczyć rozkłady dla obu wariantów odbioru sobót, rozdzielić JS według stron, odroczyć obliczenia potrzebne dopiero przy interakcji. Krytyczną treść i tabele zostawić w HTML.

Najpierw pomiar mobile Lighthouse i profilowanie; następnie poprawka konkretnego wąskiego gardła. Docelowo LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 na 75. percentylu rzeczywistych wizyt. To cele jakości, nie obecne wyniki nierobie.pl. [Web Vitals](https://web.dev/articles/vitals), [progi metryk](https://web.dev/articles/defining-core-web-vitals-thresholds).

### 3.6. Wiarygodność i dostępność

- Dodać krótką stronę „Jak liczymy”: założenia pracy pn–pt, odbiór sobót, definicja długiego weekendu, metodologia klasy i data weryfikacji zasad.
- Wyjaśnić, że górny przełącznik sobót zmienia określony bilans, podczas gdy dolne statystyki mają opisany, stały wariant z odbiorem. Użytkownik może oczekiwać jednego globalnego ustawienia.
- Nie publikować rankingu „najlepsze lata w historii” jako faktu historycznego bez weryfikacji ówczesnego prawa. Obecny model nie jest kompletną historią zmian przepisów.
- „Rozwiń szczegóły” i „Zwiń” w pełnych strategiach to obecnie klikalne `div`; zamienić je na przyciski z obsługą klawiatury i informacją o rozwinięciu.
- Dodać łatwo dostępne informacje o autorze/operatorze, prywatności, kontakcie i poprawkach danych. Nie dopisywać fikcyjnych ekspertów ani recenzentów.

## 4. Rynek i wnioski z konkurencji

| Typ konkurencji | Przykład i zaobserwowane funkcje | Wniosek dla nierobie.pl |
| --- | --- | --- |
| Duże kalendarze i serwisy dat | [DniWolne.pl](https://dniwolne.pl/) — szerokie kalendarium, święta, imieniny i okazje | Nie zaczynać od kopiowania całej encyklopedii dat |
| Bardzo bliski planer | [PlanerUrlopu.pl](https://planerurlopu.pl/) — zaznaczanie dat, eksport, wiadomość do pracodawcy, strony miesięczne | Samo „mamy kalkulator i ICS” nie jest trwałym wyróżnikiem |
| Roczniki SEO | [TopKalendarz](https://topkalendarz.pl/kalendarz-2027), [WolneDni.com](https://wolnedni.com/kalendarz-swiat-2027.html) | Konkurencja obejmuje tabele, FAQ i pobieranie; przewaga wymaga lepszego użycia danych |
| Turystyka | [TUI](https://www.tui.pl/blog/dlugie-weekendy-czyli-jak-najlepiej-zaplanowac-urlop/) — planowanie długich weekendów połączone z wyjazdami | Intencja wyjazdowa istnieje, ale nierobie.pl musi ją najpierw rozpoznać u użytkownika |
| Kalkulatory kadrowe | [KalkulatorUrlopu.pl](https://kalkulatorurlopu.pl/) — staż, etat, uprawnienia | „Kalkulator urlopu” jest niejednoznaczny; jasno mówić „ile dni potrzebujesz na ten termin” |
| Zagraniczne optymalizatory | [Holiday Optimizer](https://holiday-optimizer.com/), [Vacation Maximizer](https://www.vacation-maximizer.com/) — budżet dni, preferencje, szersze scenariusze | Inspiracja do planu całorocznego; samo tłumaczenie strony nie zapewni przewagi |
| Termin → nocleg | [Holiday Hub](https://holidayhub.co.za/tools/leave-optimizer/) pokazuje przy planowaniu przejście do pobytów | Wzorzec kontekstowego CTA; brak publicznych danych o jego skuteczności |

Nie uznaję treści konkurencji za źródło prawidłowych dat. W badanych wynikach występowały rozbieżności w liczeniu wolnego i pomijanie Wigilii. Dla nierobie.pl najlepszym źródłem jest własny, testowany silnik oparty na przepisach i danych urzędowych. Obecne zasady Wigilii opisuje [PIP](https://www.pip.gov.pl/aktualnosci/wigilia-bozego-narodzenia-dniem-wolnym-od-pracy-przepisy-wlasnie-weszly-w-zycie).

## 5. SEO: jak budować przewagę od niemal zerowego ruchu

### 5.1. Najpierw sprawdzić efekt naprawy

W Search Console: sitemap, inspekcja głównej/2027/kalkulatora, canonical wybrany przez Google i raporty indeksacji. Wpisać datę naprawy do dziennika zmian. Sprawdzać tygodniowo; wnioski o frazach wyciągać na coraz większym zbiorze wyświetleń, z uwzględnieniem sezonu.

Nie zmieniać już działających `/2027/` na bardziej „SEO-we” adresy. Nie odświeżać daty publikacji bez zmiany treści. Comiesięczny build utrzymać, lecz dodać wykrywanie nieaktualnego roku i danych po nieudanym harmonogramie. Daty kluczowych testów produkcyjnych generować względem aktualnego roku zamiast na stałe sprawdzać tylko 2026/2027.

### 5.2. Architektura treści: jedna intencja, jedna użyteczna odpowiedź

Podane adresy nowych stron są propozycjami, nie już istniejącymi funkcjami. Priorytety wynikają z dopasowania do produktu i sezonu; nie są oceną wolumenów.

| Priorytet | Intencja / przykładowe frazy | Strona | Co wnosi |
| --- | --- | --- | --- |
| P0 | dni wolne 2027, długie weekendy 2027, kiedy wziąć urlop | istniejąca `/2027/` | Główne centrum rocznika; najlepsze plany, daty, liczby |
| P0 | ile dni urlopu między datami, ile urlopu na wyjazd | istniejąca `/kalkulator-urlopu/` | Własny wynik i dalsze działania |
| P1 | urlop listopad 2026, 11 listopada urlop | `/2026/listopad/` | Kilka wariantów przerwy, konkretne dni do wniosku |
| P1 | święta 2026 urlop, Boże Narodzenie i Sylwester | `/2026/boze-narodzenie/` | Oś przełomu roku, osobne koszty w obu latach |
| P1 | Trzech Króli 2027 urlop | `/2027/trzech-kroli/` | Porównanie 0, 2 i 4 dni urlopu, eksport |
| P1 | majówka 2027 urlop | `/2027/majowka/` | Warianty przed i po 1–3 maja; odbiór za sobotę jako osobne założenie |
| P1 | Boże Ciało 2027 urlop | `/2027/boze-cialo/` | Termin, prosty plan, wariant dłuższy, kalkulator |
| P1/P2 | dni robocze 2027, godziny pracy w miesiącu | początkowo `/2027/#liczby-roku` | Sekcja już istnieje; osobna strona dopiero przy realnym rozwinięciu narzędzia |
| P2 | ile dni do urlopu, najbliższe wolne | `/ile-dni-do-urlopu/` | Własne odliczanie, dni robocze i kalendarzowe, zapis lokalny |
| P2 | ferie 2027 + województwo | `/ferie/2027/` | Oficjalne terminy i rzeczywiste dopasowanie planu rodzica |
| P2 | jak najlepiej wykorzystać 5/10/20 dni urlopu | `/planer-urlopu/` po wdrożeniu funkcji | Całoroczny budżet i porównanie wyników, bez osobnej strony dla każdej liczby |
| P2 | kalendarz 2027 do druku, planer urlopu PDF | `/do-druku/2027/` | Podgląd i rzeczywisty plik, kilka potrzebnych wariantów |
| P2 | porównanie lat, najlepszy rok na urlop | `/indeks-nierobienia/` i edycja roczna | Własna metodyka, dane i wykresy do cytowania |
| P3 | Poland public holidays, annual leave planner Poland | ograniczony dział `/en/` | Ten sam polski model dla obcokrajowców pracujących w Polsce |

Na pierwszy etap wystarczy **4–6 nowych stron sezonowych**, wypuszczanych w małych paczkach. Pierwsza paczka: końcówka 2026 oraz Trzech Króli 2027. Nie mnożyć równolegle `/dlugie-weekendy-2027/`, `/dni-wolne-2027/` i `/kalendarz-2027/` z podobną treścią.

Każda sezonowa strona powinna mieć: odpowiedź od razu, tabelę kosztów urlopu, rzeczywiste daty do wniosku, mini-kalendarz, działający wybór wariantu, eksport, ograniczenia i powrót do rocznika. Linkować do niej z odpowiednich sekcji i kart rocznika. Rocznik zawiera podsumowanie, a strona sezonowa pogłębienie.

### 5.3. Treść powinna wynikać z obliczeń

Jeden obiekt danych terminu zasila stronę, tabelę, grafikę, eksport i post. AI może przygotować język, ale liczby oraz daty bierze z silnika. Build odrzuca niespójność między tekstem a wynikiem.

Przykładowe odpowiedzi, policzone dla wolnych sobót/niedziel i bez dowolnego doliczania odbioru sobót:

- **19–27 grudnia 2026:** 9 dni wypoczynku za urlop 21–23 grudnia, czyli 3 dni.
- **1–6 stycznia 2027:** 6 dni wypoczynku za urlop 4–5 stycznia, czyli 2 dni.
- **1–10 stycznia 2027:** 10 dni wypoczynku za urlop 4–5 i 7–8 stycznia, czyli 4 dni.
- **27–30 maja 2027:** 4 dni wypoczynku za urlop 28 maja, czyli 1 dzień.

To dobra treść do udostępniania, ponieważ odbiorca dostaje plan, który może zweryfikować. Przy publikacji liczyć przykłady ponownie w buildzie, a źródła zasad utrzymywać przy metodologii.

### 5.4. Duża liczba stron nie jest celem

Nowa podstrona powstaje wtedy, gdy rozwiązuje odrębny problem i ma dane lub funkcję uzasadniającą jej istnienie. Nie indeksować wszystkich kombinacji województwo × miasto × budżet × miesiąc × rok. Województwa mają sens przy odmiennych feriach; miasta nie mają odmiennego polskiego kalendarza świąt.

Filtry i plany użytkownika nie powinny tworzyć nieograniczonego zbioru indeksowalnych URL. Warianty interfejsu mogą używać fragmentu adresu, a publiczne strony okazji mieć stabilny canonical. Nie blokować przez robots.txt strony, na której robot ma zobaczyć `noindex`. Treści generowane masowo bez wartości są objęte [zasadami Google dotyczącymi spamu](https://developers.google.com/search/docs/essentials/spam-policies).

### 5.5. SEO w wyszukiwaniu z AI

Własne porównania i działające narzędzie są bardziej obiecujące niż poradniki możliwe do odtworzenia z kilku ogólnych zdań. Do podjęcia decyzji potrzebne są: jednoznaczne jednostki, warunki wyniku, autor/operator, źródła i łatwo odczytywalny HTML. To pomaga ludziom i systemom przeglądającym strony.

Google nie wymaga osobnego „AI schema” i ignoruje `llms.txt` przy ustalaniu widoczności. Najnowszy poradnik przestrzega też przed tworzeniem strony dla każdego wariantu zapytania i sztucznymi wzmiankami. [Google: optymalizacja dla wyszukiwania generatywnego](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

Aktualizacja istotna na wrzesień 2026: w GSC sprawdzić **Ustawienia → Search generative AI**. Według Google kontrola została udostępniona globalnie 31.08.2026; domyślnie witryna jest uwzględniana, a ustawienia mogą być dziedziczone. To kontrola dopuszczenia, nie podniesienie pozycji. [Dokumentacja ustawienia](https://support.google.com/webmasters/answer/16908024). Osobny [raport widoczności generatywnej](https://support.google.com/webmasters/answer/16984139) pokazuje wyświetlenia m.in. w AI Overviews i AI Mode; przy zbyt małej liczbie wyświetleń może jeszcze nie być widoczny dla nierobie.pl.

FAQ warto rozwijać dla użytkownika. **Google wycofał FAQ rich results od 7 maja 2026**; nie wpisywać rozszerzonych wyników FAQ jako korzyści planowanego wdrożenia. [Oficjalna historia zmian Google](https://developers.google.com/search/updates).

Obecne WebSite/WebPage/WebApplication zachować. Inne dane strukturalne dodawać tylko tam, gdzie odpowiadają widocznej treści; bez wymyślonych ocen i oznaczania samego święta jako organizowanego wydarzenia.

### 5.6. Linki i rozpoznawalność

Najlepszym powodem do linkowania będzie materiał, którego autor nie chce sam obliczać: porównanie układu świąt, ranking okazji, wykres, kalendarz do pobrania. Zaoferować też widget, ale traktować go przede wszystkim jako dystrybucję produktu.

Nie wymuszać linków ze słowami kluczowymi na wszystkich stronach partnera. Link marki we wstawianym automatycznie widżecie może być `nofollow`; reklamy i afiliacja — `sponsored`. Link redakcyjny za przydatny raport jest inną sytuacją niż kupiony link. [Google: link spam](https://developers.google.com/search/docs/essentials/spam-policies#link-spam).

## 6. Katalog funkcji

Oceny są moją oceną strategiczną, nie prognozą wzrostu. **S**: około 0,5–2 dni implementacji i weryfikacji; **M**: 3–5 dni; **L**: 1–2 tygodnie. To szacunki nakładu pracy osoby wspieranej przez agentów, a nie obietnica czasu wykonania przez AI. Powtarzalne utrzymanie jest ważniejsze niż sama łatwość pierwszego wdrożenia.

| ID / etap | Propozycja | Korzyść / potencjał | Realizacja bez płatnego backendu | Nakład / utrzymanie |
| --- | --- | --- | --- | --- |
| F01 / teraz | Naprawa i wspólny eksport Google/ICS | Zaufanie i przeniesienie wyniku do działania | Istniejący kod, lokalne generowanie, CTA także w kalkulatorze | S / małe |
| F02 / teraz | „Mój plan nierobienia” | Powrót po zapisany termin | localStorage, bez konta; eksport kopii i wyraźna informacja „na tym urządzeniu” | M / małe |
| F03 / teraz | Link i karta do udostępnienia | Polecenia i rozpoznawalność | Fragment URL z wersjonowanym stanem; PNG generowany lokalnie; publiczne okazje mają własne statyczne podglądy | M / małe |
| F04 / teraz | Jedna szybka rekomendacja na górze mobile | Krótsza droga do pierwszego wyniku | Reużycie istniejących propozycji; limit 1/2/5 dni | S / małe |
| F05 / teraz | „Tylko terminy przede mną” | Przydatność bieżącego roku | Filtr lokalny; archiwalne daty nadal dostępne i opisane | S / małe |
| F06 / teraz | „Skopiuj dni do wniosku” | Domknięcie planowania | Gotowa wiadomość z faktycznymi dniami urlopu, bez obowiązku podawania danych osobowych | S / małe |
| F07 / kolejny etap | „Mam 20 dni. Ułóż mi rok” | Mocny wyróżnik i dłuższe użycie narzędzia | Algorytm działający w przeglądarce, ewentualnie Web Worker | L / średnie |
| F08 / kolejny etap | „Jeden długi urlop czy kilka krótszych?” | Przydatne porównanie, materiał do dzielenia się | Różne cele optymalizacji tego samego budżetu | M po F07 / małe |
| F09 / kolejny etap | Własny dzień odbioru za sobotę i wolne firmowe | Realistyczny plan | Lokalna lista dodatkowych dat; bez sugerowania automatycznego prawa do dowolnego terminu | M / średnie |
| F10 / kolejny etap | Tryb rodzica: ferie i przerwy szkolne | Nowe intencje SEO i atrakcyjna grupa podróżnicza | Wersjonowany JSON z danych MEN; wybór województwa | M / sezonowe |
| F11 / kolejny etap | „Poza feriami” | Pomoc osobom elastycznym | Wykluczanie opublikowanych okresów ferii; bez obietnicy niższych cen czy mniejszych tłumów | S po F10 / sezonowe |
| F12 / kolejny etap | Kalendarz do druku i PDF | Pobrania, linki, użytek w domu i firmie | CSS do druku, pliki roczne generowane podczas buildu | M / coroczne |
| F13 / kolejny etap | Subskrypcja kalendarza okazji | Kontakt z marką bez regularnego odwiedzania strony | Publiczny, statyczny feed ICS; użytkownik sam dodaje go w swoim kalendarzu | M / małe |
| F14 / kolejny etap | Odliczanie do wolnego | Powroty; prosty produkt do polecania | Data lokalna, licznik dni roboczych/kalendarzowych, skrót na ekranie telefonu | S / małe |
| F15 / kolejny etap | „Indeks Nierobienia” i porównanie lat | Własny materiał SEO/PR | Wyniki i wykresy preobliczone; publiczna metodologia | M / coroczne |
| F16 / po sygnale podróżniczym | „Co robisz, kiedy nie robisz?” | Afiliacja bez psucia głównego celu | Po wyborze terminu: wyjazd / aktywności / zostaję w domu; lekkie linki partnerów | S–M / kwartalna kontrola |
| F17 / po zainteresowaniu partnera | Widget „Kiedy warto wziąć wolne?” | Dystrybucja i potencjalna wersja z marką klienta | Statyczny iframe lub mały skrypt; link do planera | M / średnie |
| F18 / później | Plan dla pary | Wspólna decyzja i naturalne polecenia | Dwa zestawy ograniczeń wpisane na jednym urządzeniu albo wymienione linkiem | L / średnie |
| F19 / później | Własny tygodniowy rozkład pracy | Poszerzenie grupy użytkowników | Maska dni tygodnia, bez pełnego rozliczania zmian i prawa pracy | L / średnie |
| F20 / później | PWA/offline | Wygoda, instalacja bez sklepu | Cache statycznych zasobów i danych; kontrola aktualności wersji | M / średnie |
| F21 / później | Angielska wersja dla pracujących w Polsce | Nowa, wąska grupa odbiorców | Te same dane Polski, sprawdzone tłumaczenie, osobne URL i hreflang | M / sezonowe |
| F22 / mały dodatek | Generator statusu „nie robię” | Humor i łatwe udostępnianie | Sprawdzone szablony: służbowy / neutralny / zabawny; bez LLM przy każdej wizycie | S / minimalne |

### Najważniejsze doprecyzowania implementacyjne

**F02–F03: prywatny plan nie wymaga konta.** Zapis lokalny nie synchronizuje urządzeń. Link służy do świadomego przekazania dat; nie kodować w nim nazwiska ani pracodawcy. Fragment URL nie jest mechanizmem szyfrowania. Dodać „Usuń zapisane plany” oraz wersjonowanie formatu.

Podgląd linku w komunikatorze nie zobaczy osobistego stanu z fragmentu adresu. Dla własnego planu wysyła się generowaną kartę lub korzysta ze standardowego podglądu marki. Dla skończonej listy okazji można przygotować osobne HTML i PNG podczas buildu. Nie potrzeba dynamicznego serwera generującego Open Graph dla każdej kombinacji.

**F07 to nowa funkcja, inna od obecnych filtrów pojedynczej przerwy.** Wynik ma być zestawem niepokrywających się bloków na cały rok. Parametry: pozostała pula, dozwolone miesiące, minimalna długość, jeden preferowany długi wyjazd, już zajęte terminy. Obliczenia nie mogą liczyć dwa razy tego samego weekendu.

Trzeba jawnie określić cel: suma dni w wybranych przerwach, długość najdłuższej przerwy albo częstotliwość odpoczynku. Sama „łączna liczba wolnych dni w roku” przy stałej liczbie wykorzystanych dni urlopu nie zależy od ich ułożenia. Nie reklamować wyniku jako globalnego optimum, jeżeli generator korzysta tylko z ograniczonej listy kandydatów.

**F09:** dodatkowy dzień ustalony z pracodawcą może poprawić plan, ale nie można automatycznie wyznaczać go użytkownikowi. Zasady i okres rozliczeniowy opisuje [PIP: czas pracy](https://www.pip.gov.pl/dla-pracownikow/porady-prawne/czas-pracy).

**F10:** używać dat z [MEN dla roku szkolnego 2026/2027](https://www.gov.pl/web/edukacja/terminy-ferii-zimowych-w-roku-szkolnym-20262027). Ferie szkolne nie są urlopem rodzica. Dni dyrektorskich konkretnej szkoły nie wywnioskuje się z województwa; użytkownik może dodać je sam. Przyszłych terminów jeszcze nieogłoszonych nie zgadywać.

**F13:** rozróżnić pobranie jednego pliku od subskrypcji publicznego adresu. Feed wymaga stałych UID, poprawnego opisu zmian i stabilnego URL. Klient kalendarza decyduje o częstotliwości odświeżania; nie obiecywać natychmiastowych zmian ani pewnych powiadomień. Umieszczać propozycje wolnego, nie dziesiątki reklamowanych wydarzeń.

**F15:** pierwsza edycja indeksu może dotyczyć 2027 na tle 2026–2036 według tych samych obecnych zasad. Oddzielić fakty, takie jak liczba dni i daty, od autorskiego punktowania. Ujawnić wagi, odbiór sobót, zakres lat i wersję metodologii. Ciekawszy raport pokazuje, komu dany rok sprzyja: budżet 2 dni, 5 dni, jeden długi wyjazd. Nie nazywać symulacji badaniem zachowań Polaków.

### Zasady utrzymania charakteru aplikacji

- Pierwszy ekran: zrozumiała obietnica i jedna łatwa decyzja.
- Humor w nagłówkach, reakcjach i udostępnianiu; jednostki i zasady liczenia wprost.
- Zaawansowane ustawienia otwierane na żądanie.
- Podstawowe planowanie, zapis i eksport dostępne bez opłat i logowania.
- Jedna propozycja komercyjna w odpowiednim momencie, bez wyskakujących reklam zasłaniających kalendarz.
- „Zostaję w domu” jest pełnoprawnym, dobrym wynikiem. Marka obejmuje odpoczynek, nie tylko zakupy i podróże.

## 7. Monetyzacja: co ma sens przy tej skali

### 7.1. Kolejność modeli

| Model | Czy może działać przy małym ruchu? | Nakład właściciela | Rekomendacja |
| --- | --- | --- | --- |
| Afiliacja noclegów po wyborze dat | Technicznie tak; sensowny przychód zależy od liczby i jakości wejść | Początkowa aplikacja do programu, później kontrola linków i rozliczeń | Najprostsza monetyzacja ruchu, test po pojawieniu się użytkowników |
| Afiliacja atrakcji | Tak, po określeniu kierunku lub rodzaju wyjazdu | Podobny, trochę więcej pracy nad doborem propozycji | Dodatek do wybranego planu, nie ogólny katalog |
| Gotowy pakiet roczny dla HR/marketingu | Tak; klient płaci za gotowy materiał do własnej dystrybucji | Kontakt handlowy, uzgodnienie i rozliczenie | Najciekawsza próba biznesowa przy zerowym ruchu |
| Widget z marką partnera | Tak; liczy się przydatność na stronie klienta | Kilka rozmów i sprawdzenie instalacji | Zrobić jedno demo, rozwijać po zainteresowaniu |
| Sponsor edycji indeksu lub sezonu | Zależy od jakości raportu i dystrybucji, nie tylko odsłon | Sprzedaż i uzgodnienia ze sponsorem | Po pierwszym raporcie i dowodzie dotarcia |
| Pakiet cyfrowy dla użytkownika | Możliwy, ale wiele darmowych substytutów | Mała obsługa po przygotowaniu | Testować dopiero po pobraniach darmowej wersji |
| Napiwek | Może wystąpić nawet przy małym ruchu | Minimalny | Dyskretny dodatek, nie model finansowania |
| Reklamy odsłonowe | Słabo przy niemal zerowym ruchu | Konfiguracja, zgody, kontrola UX | Odłożyć |
| Abonament za podstawowy planer | Trudniejszy, bo potrzeba jest sezonowa i są darmowe alternatywy | Płatności, uprawnienia, obsługa | Nie rekomenduję na obecnym etapie |

### 7.2. Afiliacja dopasowana do intencji

Po wybraniu planu: „Masz 4 dni wolnego. Chcesz gdzieś pojechać?”. Dopiero po odpowiedzi i ewentualnym wyborze kierunku pokazać przycisk sprawdzenia noclegów lub atrakcji. Termin przekazać do partnera tylko wtedy, gdy wspiera to udokumentowany format linku. Osobno przetestować regułę wymeldowania: ostatni dzień wolnego nie zawsze oznacza ostatnią płatną noc.

Nie wyświetlać cen ani dostępności, jeżeli aplikacja ich nie pobiera. „Sprawdź noclegi w tych dniach” jest uczciwsze niż „Najtańszy wyjazd”, którego narzędzie nie wylicza. Bez ciężkich widgetów na pierwszym ekranie; link wystarczy do pierwszego testu.

Zweryfikowane opcje do rozważenia:

- **Booking.com:** oficjalna ścieżka regionalna CEE prowadzi do CJ, z aplikacją do programu i linkami partnerskimi. Nie zakładać automatycznego przyjęcia nowej strony ani stałej prowizji. Nie opierać wdrożenia na starych artykułach o Awin. [Oficjalna rejestracja Booking.com CEE w CJ](https://signup.cj.com/member/signup/publisher/?cid=5096493).
- **GetYourGuide:** oficjalny program dla twórców opisuje prowizję do 8% i 30-dniowe okno przypisania; rzeczywiste warunki zależą od programu oraz umowy. Dobrze pasuje po wyborze celu podróży. [Program GetYourGuide](https://partner.getyourguide.support/hc/en-us/articles/23082933149981-How-to-get-started-with-the-Affiliate-Program-as-a-Creator).
- **Travelpayouts:** alternatywa skupiająca programy i narzędzia. Porównać dostępność programu, akceptowane źródła ruchu i wypłaty przed wyborem; nie wdrażać kilku sieci naraz. [Platforma Travelpayouts](https://www.travelpayouts.com/).

Linki afiliacyjne i sponsoring oznaczać widocznie. W social mediach zalecenia dotyczące linków afiliacyjnych wyjaśnia [UOKiK](https://uokik.gov.pl/influencer-marketing). Atrybut `rel="sponsored"` służy wyszukiwarce; nie zastępuje oznaczenia reklamy dla człowieka.

### 7.3. Pakiet dla firm — najciekawsza opcja niezależna od ruchu

**Produkt: „Rok dobrego odpoczynku 2027”** dla HR, małej sieci hotelowej, biura podróży, wydawcy newslettera lub agencji prowadzącej ich komunikację.

Zawartość jednego zamkniętego pakietu:

- roczny planer PDF z logo klienta;
- kalendarz ICS z okazjami;
- 12 grafik i 12 krótkich tekstów do komunikacji w ciągu roku;
- rozpiska dat publikacji z wyprzedzeniem;
- wskazanie zasad liczenia i użytych źródeł;
- opcjonalnie jeden statyczny widget.

Wariant HR mówi o odpoczynku pracowników, a turystyczny o terminach wyjazdów. Dane są wspólne, zmienia się szablon. Klient kupuje oszczędność pracy i gotowy materiał do własnej publiczności. Nie trzeba obiecywać zasięgu nierobie.pl.

**Propozycja eksperymentu cenowego, nie wycena rynkowa:** 490–1490 zł za pakiet roczny, zależnie od zakresu. Pierwsza oferta powinna mieć stałą liczbę formatów, jedną rundę poprawek i jasno opisane aktualizacje. Unikać stałego prowadzenia social mediów klienta — to tworzy znacznie więcej ręcznej pracy.

AI może przygotować większość materiałów i wariantów. Nie znosi to pracy nad sprzedażą, weryfikacją, akceptacją brandingu i rozliczeniem. Przyjąć 30–90 minut uwagi właściciela na prosty projekt po dopracowaniu szablonu; pierwsze projekty mogą zająć znacznie więcej.

### 7.4. Pakiety cyfrowe dla osób prywatnych

Darmowy kalendarz roczny służy dystrybucji. Płatny dodatek może oferować estetyczne warianty: druk A3, tapety, zestaw do planowania dla pary, wersję do własnego uzupełniania. Samo pobranie podstawowych dat nie uzasadnia mocnego paywalla.

Hipoteza ceny testowej: 19–39 zł. Przy tak niskiej cenie opłata stała operatora płatności mocno wpływa na marżę. [Gumroad](https://gumroad.com/pricing) publikuje brak abonamentu, 10% + 0,50 USD przy sprzedaży bezpośredniej oraz 30% przez Discover. To usługa bez stałego kosztu, a nie sprzedaż całkowicie za darmo. Warunki wypłat trzeba sprawdzić dla konta sprzedawcy; zewnętrzna obsługa płatności nie usuwa wszystkich jego obowiązków rozliczeniowych.

### 7.5. Ekonomia afiliacji bez obietnic

Przychód zależy od:

`sesje × udział kliknięć do partnera × udział rozliczonych zakupów × średnia prowizja`.

Poniższe liczby to **wyłącznie scenariusze rachunkowe**, bez danych nierobie.pl i bez prognoz partnerów. Wspólna baza: 10 000 sesji miesięcznie.

| Scenariusz | Klik do partnera | Rozliczony zakup po kliknięciu | Średnia prowizja | Wynik |
| --- | --- | --- | --- | --- |
| Ostrożny | 5% | 1% | 20 zł | 100 zł/mies. |
| Środkowy | 8% | 2% | 40 zł | 640 zł/mies. |
| Wysoki | 12% | 3% | 50 zł | 1800 zł/mies. |

Przy 1000 sesji wartości dzielą się przez 10. Przy niemal zerowym ruchu afiliacja nie daje obecnie podstaw do oczekiwania istotnego przychodu. Uwzględniać opóźnione rozliczenie pobytu, anulacje i różnice między kliknięciem a zaakceptowaną prowizją. Z tego powodu jednorazowa sprzedaż dobrego pakietu B2B może być wartościowsza od wczesnego obwieszania strony reklamami.

## 8. Pomysły poza aplikacją — z małą pracą właściciela

Nie jest konieczne prowadzenie wszystkich kanałów. Wybrałbym **raport z materiałami dla innych** oraz **jeden własny kanał dystrybucji**. Pakiet B2B można testować osobno. Szacunki pracy właściciela zakładają gotowy proces generowania i nie obejmują pierwszego wdrożenia.

| ID | Pomysł | Co robią agenci i skrypty | Co zostaje właścicielowi | Ocena |
| --- | --- | --- | --- | --- |
| D01 | Coroczny „Indeks Nierobienia” i zestaw dla mediów | Obliczenia, wykresy, 3–5 obserwacji, opisy metodologii, propozycja krótkiego pitchu | Ocena faktów i wybranych kontaktów; około 1–2 h przy edycji | Najlepszy materiał na naturalne cytowania i markę |
| D02 | Gotowa rubryka „Kiedy wziąć wolne” dla istniejących newsletterów | Krótki tekst, karta, link do planu, terminy sezonowe | Uzgodnienie z 1–3 wydawcami; później 15–30 min na paczkę | Dobry sposób na dotarcie przy zerowej własnej bazie |
| D03 | Sezonowe grafiki na LinkedIn lub Pinterest | 6–10 kart z danych, różne rozmiary, opisy i linki | Selekcja oraz zaplanowanie; około 30–60 min/mies. | Tani eksperyment; zasięgi nie są gwarantowane |
| D04 | Newsletter „Dobrze zaplanowane nic” | 6–8 wydań rocznie przed ważnymi okazjami, jeden plan i jedno CTA | Sprawdzenie oraz wysyłka; około 15–30 min/wydanie | Buduje własną bazę, ale nie jest pierwszym źródłem ruchu |
| D05 | Publiczny kalendarz ICS do subskrypcji | Generacja i walidacja feedu, wersjonowanie zmian | Okresowa kontrola danych i linków | Najmniej obsługi, dobry stały punkt kontaktu |
| D06 | Darmowy planer do druku / arkusz roczny | Pliki z tych samych danych, mini-instrukcja, grafika podglądu | Kontrola rocznej wersji, około 30–60 min | Przydatny dla użytkowników i HR, most do pakietu B2B |
| D07 | Widget dla blogów podróżniczych, hoteli i intranetów | Kod do osadzenia, konfigurator, demo, dokumentacja | Weryfikacja kilku partnerów i instalacji | Dystrybucja przez cudzy ruch; obsługa większa niż PDF |
| D08 | Publiczny zestaw danych „okazje urlopowe w Polsce” | JSON/CSV/ICS, opis pól, źródła i testy | Decyzja o licencji i okresowe aktualizacje | Materiał dla programistów, dziennikarzy i integratorów |

### D01: gotowy format pierwszego raportu

Tytuł roboczy: **„Indeks Nierobienia 2027. Kiedy mała pula urlopu daje najwięcej odpoczynku?”**

Zamiast rankingu samej liczby świąt pokazać trzy budżety urlopu, najlepsze krótkie przerwy, najdłuższą przerwę między świętami i porównanie z poprzednim rokiem. Paczka dla mediów: strona HTML jako źródło, tabela danych, dwa wykresy PNG, pięć gotowych obserwacji i informacja, jak cytować. Dziennikarz otrzymuje materiał do wykorzystania, a nie prośbę „napisz o naszej aplikacji”.

Pierwsza dystrybucja: mała, dobrana lista mediów pracy/HR, serwisów lokalnych i twórców podróżniczych. Badanie kontaktów oraz przygotowanie treści może wykonać agent. Rozsyłanie i publikacja wymagają osobnej decyzji właściciela o odbiorcach i kanale. Nie opierać strategii na masowym cold mailu ani automatycznych komentarzach.

### D03: jeden zestaw danych, wiele użyć

Przykładowe motywy: „3 dni urlopu. 9 dni świętego spokoju”, „Ten piątek ma potencjał”, „2027: plan dla tych, którzy mają tylko dwa dni”. Każda karta zawiera rok, daty, koszt i odsyła do konkretnego planu. Bez fikcyjnych opinii, zdjęć rzekomych podróży czy niezweryfikowanych cen.

Na początek pojedynczy kanał. [Buffer Free](https://buffer.com/pricing) pozwala na trzy kanały i kolejkę 10 wpisów na kanał. [Import zbiorczy](https://support.buffer.com/en-us/articles/how-to-upload-posts-in-bulk-to-buffer-cTIhl4mv6H) jest dostępny także na Free, w granicach wolnych miejsc kolejki. To wystarcza do sezonowej paczki; nie trzeba budować integracji z kilkoma API społecznościowymi.

### D04: newsletter lekki także operacyjnie

Zapisy obiecywać na kilka ważnych okazji rocznie. Bez cotygodniowego wydania tworzonego tylko po to, żeby dotrzymać rytmu. Zapis dobrowolny, z potwierdzeniem i prostym wypisaniem. Formularz może prowadzić do strony dostawcy i nie wymaga bazy na hostingu nierobie.pl.

[Kit Free](https://help.kit.com/en/articles/16627071-the-kit-free-plan) oferuje do 10 000 subskrybentów i nielimitowane wysyłki typu broadcast. Aktualna dokumentacja przypisuje sekwencje, automatyzacje, kampanie RSS i Kit MCP do planów płatnych. Darmowy model dla nierobie.pl to kilka zaplanowanych wydań; nie zakładać darmowej rozbudowanej automatyzacji. Po osiągnięciu limitu trzeba ograniczyć zapisy albo zmienić model — to nie jest infrastruktura darmowa bez żadnych granic.

### D08: dane publiczne jako zaproszenie do współpracy

Przygotować dokumentację: co oznacza „koszt urlopu”, „dni wypoczynku”, zakres dat, zasady sobót i wersja danych. Nie udostępniać planów użytkowników. Podstawowe dane mogą być otwarte, a płatną ofertą pozostają konfiguracja, własny branding i zamknięty pakiet publikacyjny. Samo surowe zestawienie dat będzie trudne do sprzedawania, bo ma darmowe substytuty.

## 9. Infrastruktura: realne 0 zł stałego kosztu

### 9.1. Obecny hosting a komercjalizacja

Repo publikuje na GitHub Pages. GitHub wyraźnie ogranicza używanie Pages jako darmowego hostingu do prowadzenia biznesu, e-commerce i komercyjnego SaaS. Nie rozstrzygam, że pojedynczy link afiliacyjny automatycznie narusza warunki; rekomenduję jednak nie budować docelowego modelu biznesowego na niepewnej interpretacji. [GitHub Pages: ograniczenia](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).

**Rekomendacja przed uruchomieniem komercyjnej oferty:** ten sam katalog `dist` na Cloudflare Pages Free. Alternatywą jest Workers Static Assets bez kodu wykonywanego dla zwykłych żądań. To zmiana publikacji statycznych plików, nie powód do przepisywania React/Vite. Sama obecność CDN Cloudflare przed GitHub Pages nie zmienia dostawcy hostingu źródłowego.

Nie robić migracji jednocześnie ze zmianą adresów, projektu graficznego i treści. Zachować domenę, canonicale, końcowe ukośniki i rzeczywiste 404, sprawdzić docelowy hosting przed przełączeniem, następnie ponowić test publicznych URL. Gotowy poprzedni deployment zachować jako możliwość powrotu.

### 9.2. Proponowany zestaw

| Element | Rozwiązanie | Warunek utrzymania darmowego modelu |
| --- | --- | --- |
| Hosting HTML/CSS/JS/PNG/ICS | Cloudflare Pages Free | Projekt statyczny; obecnie 500 buildów/mies., 20 000 plików, maks. 25 MiB na plik |
| Alternatywa hostingu | Workers Static Assets | Żądania bezpośrednio do zasobów; nie włączać Worker-first dla całej aplikacji |
| Kod i build | Obecny Git + lokalny build lub CI w darmowym limicie | Nie uruchamiać ciężkiego przeliczenia przy każdej wizycie |
| Obliczenia użytkownika | Przeglądarka | Algorytm deterministyczny, bez płatnych wywołań AI |
| Zapis planu | localStorage i plik kopii | Brak obietnicy synchronizacji między urządzeniami |
| Treści i dane | Wersjonowane pliki w repo | Zmiany przeglądane i walidowane przed publikacją |
| PDF, grafiki, raporty | Generowanie w buildzie lub lokalnie | Brak usługi generującej każdy dokument na serwerze |
| Kalendarze | Pliki/feed ICS + link Google Calendar | Bez OAuth i przechowywania tokenów użytkowników |
| Pomiar | Search Console i istniejące GA4 | Zdarzenia ograniczone do potrzeb produktu, obsługa zgód |
| Kontakt handlowy | Istniejący email / prosty mailto | Bez własnego CRM i formularza wymagającego backendu na start |
| Opcjonalny newsletter | Kit Free | Limit bazy i ograniczenia funkcji opisane wyżej |
| Opcjonalna sprzedaż plików | Zewnętrzny checkout i dostawa | Brak abonamentu; opłaty od transakcji pozostają |

[Limity Cloudflare Pages](https://developers.cloudflare.com/pages/platform/limits/) i [darmowe żądania do projektu statycznego](https://developers.cloudflare.com/pages/functions/routing/) wspierają ten wariant. [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) ma darmowe, nielimitowane żądania do zasobów; uruchamianie skryptu Workers podlega innym limitom i rozliczeniom. Nie jest to obietnica niezmienności warunków dostawcy w przyszłości.

Vercel Hobby nie jest domyślną alternatywą pod zarabianie — ogranicza użycie do osobistego i niekomercyjnego. [Warunki Vercel Hobby](https://vercel.com/docs/plans/hobby).

**Nie są potrzebne na proponowany start:** płatny serwer, baza danych, Redis, Supabase, wyszukiwarka ofert na żywo, własne płatności, konta użytkowników ani LLM działający w aplikacji. AI służy do rozwoju, weryfikacji i produkcji materiałów. Koszt dostępu do agentów, domena, podatki i opłaty transakcyjne są odrębne od kosztu hostingu; „free infrastruktura” nie oznacza zerowego kosztu całego biznesu.

## 10. Proces pracy z agentami

### Powtarzalny proces publikacji

1. Skrypt wylicza daty, warianty urlopu i statystyki z jednej wersji zasad.
2. Agent przygotowuje propozycję tekstu i materiałów, odwołując się do danych.
3. Walidator porównuje wszystkie liczby i zakresy dat; sprawdza linki, metadata i pliki.
4. Przegląd merytoryczny obejmuje nowe źródła i nowe twierdzenia. Przegląd UI obejmuje mobile oraz druk, jeżeli powstaje PDF.
5. Właściciel zatwierdza krótki pakiet zmian i działania publikacyjne wymagające jego decyzji.
6. Po publikacji test HTTP, canonicali, danych i działania najważniejszych CTA.

Zmiany merytoryczne przepisów albo terminów szkolnych powinny dawać propozycję aktualizacji do sprawdzenia. Rutynowy rollover roku, oparty na zweryfikowanych regułach i przechodzący testy, może działać automatycznie. Nie potrzebuje cotygodniowego generowania nowych artykułów.

Docelowa praca właściciela w wybranym, lekkim wariancie: kontrola stanu i sezonowej paczki, około 1–2 h miesięcznie po ustabilizowaniu procesu, więcej przy raportach i klientach B2B. To założenie organizacyjne. Sprzedaż i rozwój kanału od zera mogą wymagać większego nakładu niż utrzymanie samego serwisu.

### Przygotowanie danych pod wiele wyjść

Przykładowy rekord okazji: identyfikator, rok, początek i koniec wypoczynku, lista dni urlopu, liczba świąt/weekendów, dodatkowe dni firmowe, założenia, źródło i wersja zasad. Z niego generować stronę, grafikę, PDF, ICS, post i dane widgetu. Ręczne przepisywanie dat do każdego kanału tworzyłoby niepotrzebną pracę i ryzyko błędu.

## 11. Kolejność prac i kryteria decyzji

### Pierwsze 2 tygodnie: wiarygodność i wykorzystanie obecnego produktu

1. Naprawić eksport i dodać testy prawdziwych lokalnych dat.
2. Dodać pomiar świadomego wyboru planu i dalszych działań; zachować datę bazową naprawy SEO.
3. Skrócić ścieżkę mobile, dodać kopiowanie dni do wniosku i eksport z kalkulatora.
4. Wdrożyć podstawowy zapis planu oraz udostępnienie.
5. Przygotować pierwsze strony: listopad 2026, święta 2026, Trzech Króli 2027.
6. Zweryfikować główne URL w GSC i kontrolować odkrywanie nowych stron.

Kryterium: każdy nowy plan ma spójne daty we wszystkich formatach, strona sezonowa działa także jako czytelna odpowiedź bez JS, a działania użytkownika są mierzalne. Nie wymagać określonej pozycji po dwóch tygodniach.

### Tygodnie 3–6: pierwsza dystrybucja i test biznesowy

1. Opublikować pierwszą edycję indeksu wraz z danymi i materiałami.
2. Przygotować paczkę dla kilku dobranych wydawców oraz jeden kanał sezonowych kart.
3. Uruchomić darmowy wydruk/ICS jako powód do polecenia strony.
4. Przygotować jedno demo pakietu B2B i zebrać reakcje na konkretną ofertę.
5. Przygotować hosting Cloudflare i wykonać migrację przed rozwinięciem oferty komercyjnej.
6. Jeśli pojawią się użytkownicy wybierający wyjazd, wdrożyć jeden program afiliacyjny.

Kryterium: pierwsze świadome użycia, pobrania/polecenia, redakcyjne wzmianki albo konkretne zainteresowanie pakietem. Brak ruchu po kilku publikacjach nie jest sygnałem do produkcji setek podstron; sprawdzić indeksację, trafność treści i kanał dotarcia.

### Tygodnie 7–12: pogłębianie tego, co działa

- Jeżeli użytkownicy zapisują kilka terminów: roczny optymalizator F07.
- Jeżeli wyświetlenia i zapytania dotyczą ferii: tryb rodzica F10.
- Jeżeli partnerzy proszą o osadzenie: widget F17.
- Jeżeli pobierają i wracają: rozwinąć zapis, feed oraz krótki newsletter.
- Jeżeli interesuje ich tylko konkretna data: poprawiać krótkie odpowiedzi i przekierowanie do planowania, zamiast dokładać funkcje bez potwierdzonej potrzeby.

### Mierniki i interpretacja

| Obszar | Co mierzyć | Jak podejmować decyzję |
| --- | --- | --- |
| Technika | Poprawne HTTP, canonicale, HTML, aktualność danych | Regresję naprawić od razu; to warunek konieczny |
| SEO | Indeksacja kluczowych URL, wyświetlenia i kliknięcia według klastra | Oceniać trend i sezon, osobno markę oraz frazy niemarkowe |
| Wartość produktu | Świadomy wybór i zapis/eksport planu | Ustalić własny punkt wyjścia; nie traktować domyślnego wyniku jako konwersji |
| Dystrybucja | Kliknięcie udostępnienia, wejścia z oznaczonych linków, pobrania | Kliknięcie przycisku „udostępnij” nie dowodzi skutecznego polecenia |
| Afiliacja | Kliknięcia, rozliczone transakcje, prowizja na kliknięcie | Dawać czas na rozliczenie; nie wyciągać wniosków z kilku kliknięć |
| B2B | Odpowiedzi na demo, zakres zainteresowania, płatny pilotaż, czas obsługi | Warunkiem rozszerzania oferty jest gotowość do zapłaty i mała liczba wyjątków |

Przy małym ruchu preferować jedną wersję funkcji, krótkie obserwacje użytkowników i zmiany następujące po sobie. Test A/B na kilku wizytach nie daje solidnej podstawy do wyboru. Jako robocze punkty przeglądu można przyjąć pierwsze 100 świadomie wybranych planów, 200 kwalifikowanych kliknięć do partnera i rozmowy z 5 potencjalnymi odbiorcami pakietu. To progi organizacyjne, nie wymagana wielkość próby statystycznej ani gwarancja sukcesu.

## 12. Pomysły do odłożenia

| Pomysł | Dlaczego teraz nie |
| --- | --- |
| Pełny chatbot o prawie pracy | Koszt, ryzyko błędów i duży zakres merytoryczny; słabo pasuje do prostoty produktu |
| Obliczanie uprawnień 20/26 dni i ekwiwalentu | Inna intencja niż planowanie terminu; aktualne zasady wymagają regularnej weryfikacji |
| Wyszukiwarka najtańszych lotów i noclegów | Zależność od API, jakości cen, dostępności i większej obsługi |
| Konta, synchronizacja i społeczność | Utrzymanie, dane użytkowników, moderacja; zapis lokalny pokrywa pierwszy problem |
| Pełny SaaS kadrowy | Zmienia klienta, ton produktu i wymagania; wystarczy pakiet dla HR |
| Ekspansja do kilkudziesięciu krajów | Wiele reguł regionalnych, tłumaczeń i zmian; najpierw jeden sprawdzony model Polski |
| Tysiące artykułów AI i stron miast | Powtarzalna treść, brak wyróżnika, ryzyko marnowania indeksacji i uwagi |
| Codzienny content na wielu platformach | Wysoki koszt obsługi; sezonowy produkt potrzebuje publikacji w odpowiednich momentach |
| Od razu aplikacje App Store/Google Play | Koszty kont, dystrybucji i utrzymania; web oraz późniejsze PWA wystarczą do testu |
| Koszulki i fizyczne kalendarze | Pasują do marki, lecz sprzedaż, dostawa i reklamacje zwiększają ręczną pracę |
| Płatne kampanie zanim wiadomo, co konwertuje | Zużywają budżet, którego obecny model nie potrzebuje do sprawdzenia wartości |

Przykład zmienności zakresu kadrowego: w 2026 weszły nowe zasady uwzględniania części wcześniejszych okresów aktywności zawodowej w stażu pracy. To dodatkowy powód, by nie traktować kalkulatora uprawnień jako prostego dopisku do dat. [MRPiPS: staż pracy — pytania i odpowiedzi](https://www.gov.pl/web/rodzina/staz-pracy-qa).

## 13. Mój wybór, gdyby ograniczyć projekt do pięciu inwestycji

1. **Niezawodny, zapisywalny i udostępniany plan** — naprawiony eksport, spójne CTA, brak konta.
2. **Kilka doskonałych stron sezonowych** — istniejący silnik zamienia się w użyteczne odpowiedzi SEO.
3. **Indeks Nierobienia z coroczną paczką do cytowania** — własny powód, aby marka pojawiała się poza aplikacją.
4. **Kontekstowe przejście od daty do noclegu/aktywności** — najprostsza droga do monetyzacji przyszłego ruchu.
5. **Powtarzalny pakiet roczny dla firm** — możliwość przychodu bez czekania na dużą publiczność nierobie.pl.

To układ, w którym ta sama praca nad datami i obliczeniami poprawia aplikację, tworzy treści SEO i dostarcza materiał handlowy. Wzrost liczby użytkowników zwiększa potencjał przychodu, a nie koszt każdego kolejnego obliczenia.
