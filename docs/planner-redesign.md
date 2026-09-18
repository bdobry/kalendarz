# Planer: decyzje produktowe

## Podział odpowiedzialności

- `/{rok}/#planer`: szybkie zaznaczenie urlopu, pula, szkoła. Pokazuje zapisane donacje, ale ich nie edytuje.
- `/kalkulator-urlopu/`: Planer urlopu. Przegląd roku, bilans, najbliższa przerwa, lista ciągów wolnego, dodanie zakresu, propozycje mostków i kalendarz.
- `/planer-krwiodawcy/`: Planer krwiodawcy. Osobny przegląd, formularz/historia/profil/limity oraz kalendarz z narzędziami Krew i Osocze.
- Wspólny `nierobie.personal-plan.v1`, bez migracji modelu ani zmiany reguł donacji. Reset dotyczy wyłącznie aktywnego rodzaju danych i roku.

API integracji: `<PersonalPlanner planningDate={planningDate} workspace="donations" />`; domyślny `workspace="leave"`. `calendarYear` oznacza zawsze prosty planer urlopu. Linki zachowują `#rok=YYYY`; `widok=kalendarz` otwiera kalendarz. Stare `sekcja=donacje` przechodzi do nowego adresu.

## Research (18.09.2026)

1. [Linear — My issues](https://linear.app/docs/my-issues): osobisty widok skupia informacje według priorytetu działania. [Custom views](https://linear.app/docs/custom-views): alternatywne widoki tych samych danych i zwijane grupy. Wniosek projektowy: jeden plan, dwa widoki „Przegląd / Kalendarz”; następna przerwa przed pełną historią. Nie kopiujemy wizualnego języka Linear.
2. [Timestripe — Horizons](https://timestripe.com/magazine/learning-center/tutorials/how-to-plan-the-future-effectively-with-horizons/): przechodzenie między horyzontami czasu bez gubienia celu. Wniosek: roczny rytm miesięcy jest skrótem do konkretnego miesiąca kalendarza; bilans pozwala rozumieć konsekwencję wyboru dat.
3. [Dyskusja użytkowników Holiday Optimizer](https://www.reddit.com/r/SideProject/comments/1omgrn9/i_built_a_free_tool_that_turned_my_15_pto_days/): komentarze proszą o eksport do kalendarza, uwzględnianie szkoły i zapisanych wyjazdów; część osób nie rozumie sumy dni wolnych, inni mają trudność z kolorami. To jakościowe sygnały z pojedynczej dyskusji, nie reprezentatywne badanie. Wniosek: jawny koszt urlopu obok długości przerwy, tekstowe etykiety, zachowana szkoła, eksport ICS. Nie przywracamy wcześniej usuniętego interfejsu importu/eksportu kopii JSON ani udostępniania.
4. [Dyskusja o wizualizacji planu podróży](https://www.reddit.com/r/TravelHacks/comments/1ecb5nu/best_planning_app_with_time_blocking/): autor opisuje trudność z oceną rzeczywistego czasu i nakładaniem wpisów. Wniosek: ciągi wolnego wyliczamy z istniejącego silnika; nie tworzymy ręcznej, konkurencyjnej listy wyjazdów.

## Zakres i granice

Najpierw użyteczne decyzje: ile zostało, kiedy następna przerwa, jak dodać cały termin, gdzie są dni w roku. Szczegóły i informacje o regułach są rozwijane. Bez kont, zespołów, akceptacji wniosków, rezerwacji i rozbudowanego zarządzania podróżą. Grafik zmianowy, niestandardowe dni firmy i naliczanie godzin wymagają odrębnego modelu — nie symulujemy ich kolorami. Obecne założenie pn–pt pozostaje jawne.

Kolory zachowują znaczenie: limonka = świadomie wybrany urlop; jasny fiolet = dni już wolne; morski = donacja. Dashboard używa tych samych danych co kalendarz, nie dodatkowych liczników utrzymywanych ręcznie. Zapis i generowanie pliku ICS pozostają lokalne; eksport dotyczy wyłącznie aktywnego rodzaju danych.
