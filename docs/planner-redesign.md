# Planer: decyzje produktowe

## Podział odpowiedzialności

- `/{rok}/#planer`: szybkie zaznaczenie urlopu, pula, szkoła. Pokazuje zapisane donacje, ale ich nie edytuje.
- `/kalkulator-urlopu/`: Planer urlopu. Kalendarz jest główną, stale widoczną strefą pracy. Obok jego narzędzi są pula i bilans, dodanie zakresu oraz szkoła; lista przerw i propozycje mostków uzupełniają kalendarz.
- `/planer-krwiodawcy/`: Planer krwiodawcy. Stale widoczny kalendarz Krew/Osocze, podpowiedź kolejnego terminu według zapisanych donacji, formularz, historia i profil dawcy.
- Wspólny `nierobie.personal-plan.v1`, bez migracji modelu ani zmiany reguł donacji. Reset dotyczy wyłącznie aktywnego rodzaju danych i roku.

API integracji: `<PersonalPlanner planningDate={planningDate} workspace="donations" />`; domyślny `workspace="leave"`. `calendarYear` oznacza zawsze prosty planer urlopu. Linki zachowują `#rok=YYYY`; stare `widok=kalendarz` jest nadal obsługiwane, ale nie steruje już widokiem. Stare `sekcja=donacje` przechodzi do nowego adresu.

## Redesign 21.09.2026

Nie ma już przełącznika „Przegląd / Kalendarz”. Znika konkurencja dwóch ekranów z podobnymi licznikami i utrata kontekstu po przejściu do edycji. Kalendarz jest dostępny również w statycznym HTML bez JavaScriptu. Dwie duże, opisane opcje wyboru narzędzia wskazują aktywny planer i zachowują rok przy przejściu. Klasa efektywności pozostaje wyłącznie w widoku roku; nie odpowiada na pytanie o osobisty plan lub terminy donacji.

Pierwsza wizyta ma prowadzić do działania: krótka instrukcja przy nagłówku, zaznaczanie dni, jedno źródło bilansu. Szczegóły dat, reguł i przechowywania danych są dostępne niżej lub po rozwinięciu. Usunięto duży wykres rocznego rytmu, powtórzone podsumowania i przełączanie kalendarza.

W kalendarzu donacji nie proponujemy mostków urlopowych. Nadal widać zapisany urlop ze wspólnego planu; jego legenda pojawia się tylko, gdy dotyczy widocznych dat. Oznaczenie donacji jest dostępne od pierwszej wizyty. Bez zaplanowanej donacji nie pokazujemy dodatkowej pustej karty „następny termin”. Formularz zakresu zamyka się po dodaniu dat i oddaje fokus przyciskowi; Escape pozwala go zamknąć bez zapisu. Komunikaty planera pozostają widoczne podczas przewijania.

### Kontekst krwiodawcy

- [NHS Give Blood](https://www.blood.co.uk/the-donation-process/using-your-online-account/) łączy przyszłe terminy i historię w osi donacji. [American Red Cross](https://www.redcrossblood.org/donate-blood/manage-my-donations.html) rozdziela zarządzanie terminem i historię. Wniosek projektowy: najpierw następny krok i możliwość poprawienia terminu, bez dużych liczników wolnego od pracy.
- [MojaKrew, opis RCKiK w Gdańsku](https://krew.gda.pl/aplikacja-mojakrew,476,pl.html) udostępnia kolejny termin i historię, ale także dane medyczne połączone z systemem centrum. Nasz planer korzysta wyłącznie z wpisów użytkownika; nie symuluje wyników badań, rezerwacji, litrażu ani kwalifikacji.
- [Kalkulator RCKiK w Łodzi](https://krwiodawstwo.pl/dla-krwiodawcy/kalkulator-donacji/) prowadzi od rodzaju i daty poprzedniej donacji do następnego terminu. Wniosek: podpowiedź daty ma wypełniać formularz, a zapis wymaga świadomego działania użytkownika.

`nextDonationSlot` reużywa istniejący silnik `donationRules`. Szuka pierwszego dodatkowego terminu od podanej daty w wybranym zakresie. Bierze pod uwagę wcześniejsze **i późniejsze** wpisy, oba rodzaje donacji, profil i limity w ruchomym oknie 12 miesięcy. Nie zmienia dotychczasowych reguł ani zapisanych danych. Przy konflikcie istniejących wpisów kieruje do ich poprawienia; nie wyświetla pewnej daty. W roku minionym i poza zakresem nie sugeruje daty z przeszłości.

„Termin wg zapisanych donacji” oznacza wynik modelu kalendarzowego, nie potwierdzenie kwalifikacji w centrum. Brak historii nie jest dowodem braku wcześniejszych pobrań. Miniona data nie oznacza potwierdzonej donacji; odwołane wpisy trzeba usunąć. Dlatego historia pozostaje istotnym elementem pierwszej wizyty, a informacja o kwalifikacji jest przy wyniku.

## Research (18.09.2026)

1. [Linear — My issues](https://linear.app/docs/my-issues): osobisty widok skupia informacje według priorytetu działania. [Custom views](https://linear.app/docs/custom-views): alternatywne widoki tych samych danych i zwijane grupy. Początkowo wdrożono „Przegląd / Kalendarz”; feedback z 21.09 zastępuje je jednym widokiem z kalendarzem. Zachowujemy priorytet działania i krótkie podsumowania, bez kopiowania wizualnego języka Linear.
2. [Timestripe — Horizons](https://timestripe.com/magazine/learning-center/tutorials/how-to-plan-the-future-effectively-with-horizons/): przechodzenie między horyzontami czasu bez gubienia celu. Wniosek: lista przerw prowadzi do konkretnego miesiąca kalendarza; bilans pozwala rozumieć konsekwencję wyboru dat. Osobny wykres miesięcy usunięto w kolejnym redesignie.
3. [Dyskusja użytkowników Holiday Optimizer](https://www.reddit.com/r/SideProject/comments/1omgrn9/i_built_a_free_tool_that_turned_my_15_pto_days/): komentarze proszą o eksport do kalendarza, uwzględnianie szkoły i zapisanych wyjazdów; część osób nie rozumie sumy dni wolnych, inni mają trudność z kolorami. To jakościowe sygnały z pojedynczej dyskusji, nie reprezentatywne badanie. Wniosek: jawny koszt urlopu obok długości przerwy, tekstowe etykiety, zachowana szkoła, eksport ICS. Nie przywracamy wcześniej usuniętego interfejsu importu/eksportu kopii JSON ani udostępniania.
4. [Dyskusja o wizualizacji planu podróży](https://www.reddit.com/r/TravelHacks/comments/1ecb5nu/best_planning_app_with_time_blocking/): autor opisuje trudność z oceną rzeczywistego czasu i nakładaniem wpisów. Wniosek: ciągi wolnego wyliczamy z istniejącego silnika; nie tworzymy ręcznej, konkurencyjnej listy wyjazdów.

## Zakres i granice

Najpierw użyteczne decyzje: ile zostało, kiedy następna przerwa, jak dodać cały termin, gdzie są dni w roku. Szczegóły i informacje o regułach są rozwijane. Bez kont, zespołów, akceptacji wniosków, rezerwacji i rozbudowanego zarządzania podróżą. Grafik zmianowy, niestandardowe dni firmy i naliczanie godzin wymagają odrębnego modelu — nie symulujemy ich kolorami. Obecne założenie pn–pt pozostaje jawne.

Kolory zachowują znaczenie: limonka = świadomie wybrany urlop; jasny fiolet = dni już wolne; morski = donacja. Dashboard używa tych samych danych co kalendarz, nie dodatkowych liczników utrzymywanych ręcznie. Zapis i generowanie pliku ICS pozostają lokalne; eksport dotyczy wyłącznie aktywnego rodzaju danych.


### Ustawienia dawcy i rezerwacja wizyty

Limit krwi pełnej jest nad kalendarzem, obok wyboru rodzaju donacji. Zmiana nadal sprawdza całą historię oraz przyszłe wpisy; konflikt pozostaje przy ustawieniu, a dotychczasowy profil i daty nie zmieniają się. Profil jest wspólny dla wszystkich lat.

Skróty prowadzą do logowania w IKP i oficjalnej wyszukiwarki centrów. [Pacjent.gov.pl — Chcę oddać krew](https://pacjent.gov.pl/chce-oddac-krew) opisuje planowanie wizyt w sekcji Apteczka → Krwiodawstwo; dostępność zależy od centrum. Rozwijana instrukcja rozróżnia zapis lokalny i rezerwację. Linki nie przekazują dat, profilu ani treści planu. Sprawdzone 21.09.2026.

### Podgląd strategii i porównanie okresów

Mini-strategia roku wybiera najpierw najkorzystniejszy przelicznik spośród przerw od 14 dni, a potem najlepsze warianty innych okresów. Przy takim samym przeliczniku długiej przerwy wygrywa więcej wolnego. Podgląd dotyczy przerw rozpoczynających się w wybranym roku; pełna lista planera zachowuje także wcześniejszy przełom grudnia i stycznia. Propozycje nie nakładają się i nie powtarzają okresu.

„Lepszy niż X% układów” oznacza odsetek unikalnych wariantów tego samego okresu z niższym stosunkiem dni wolnego do dni urlopu (porównanie 2024–2100). Remisy nie zwiększają wyniku; odsetek zaokrąglamy w dół. To nie procent dodatkowego urlopu ani prawdopodobieństwo. „Najlepszy układ: RRRR” wskazuje kolejny rok z maksymalnym przelicznikiem w tym samym okresie; koszt i długość mogą się różnić. Lata w danych są latami rozpoczęcia przerwy.

Źródło obliczeń: aktualny `analyzeVacationStrategies` oraz odświeżony `data/vacationStats.json`, generowany przez `scripts/generateVacationStats.ts`. Grudniowo-styczniową przerwę, obecną w dwóch analizach rocznych, liczymy raz. Częstotliwość występowania liczymy na podstawie różnych lat, nie liczby wariantów w roku.

Mikro-oś dni współdzieli oznaczenie `LeaveWave` z kalendarzem. Na wąskich ekranach przewija się w jednej linii. W planerze kliknięcie treści karty otwiera szczegóły, a przyciski dodawania i wyjaśnienia oceny działają niezależnie; nagłówek i przycisk szczegółów obsługują klawiaturę.
