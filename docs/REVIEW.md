# Wynik przeglądu kodu i SEO

Data: 14 września 2026.

## Status

Zmiany zostały zapisane w repozytorium i sprawdzone lokalnie. Nie wykonano commita, pushu ani deploymentu. Produkcyjny hosting i indeksacja w Google wymagają kontroli po publikacji.

## Niezależne przeglądy

- **Code review:** agent wykrył P2 — identyfikatory strategii zależały od strefy czasowej, więc build w UTC i przeglądarka w Polsce mogły mieć różne ID kart. ID oraz klucze deduplikacji korzystają teraz z lokalnych pól daty YYYY-MM-DD. Agent ponownie sprawdził poprawkę i zamknął uwagę. Brak dalszych istotnych uwag.
- **Review SEO:** agent wykrył P2 — FAQ podawało początek wypoczynku jako datę urlopu, choć mógł to być dzień świąteczny. FAQ pokazuje teraz rzeczywiste dni urlopu oraz osobno pełny zakres wypoczynku. Agent potwierdził poprawkę. Brak dalszych zgłoszonych problemów SEO.

## Weryfikacja końcowa

- Czysta instalacja `npm ci`: sukces.
- `npm run typecheck`: sukces.
- `TZ=UTC npm run test:run`: 105 testów w 12 plikach, wszystkie zaliczone.
- `TZ=UTC npm run build`: 112 statycznych stron; 10 indeksowalnych URL w sitemap.
- Walidacja SEO: unikalne tytuły, opisy i H1, canonicale, JSON-LD, lokalne linki i zasoby, noindex dla pozostałych lat i prawdziwa strona błędu 404.
- Porównanie pełnego HTML kalendarza: identyczny wynik dla UTC, Europe/Warsaw, America/Los_Angeles i Pacific/Auckland.
- Testy przeglądarkowe: 6/6 — kody HTTP i redirect, widok bez JavaScript, hydratacja i historia, kalkulator, strefy czasowe z rozwijaniem i przewijaniem kart oraz szerokość mobilna.
- Końcowy widok mobilny: szerokość strony 390 px przy viewport 390 px. Usunięto przepełnienie osi czasu i niewidocznych tooltipów.
- Kontrola wizualna strony głównej i mobilnych kart: wykonana.
- `git diff --check`: bez błędów.
- Po aktualizacji zgodnych wersji zależności `npm audit` zgłosił 0 podatności.

Sprawdzono też finalny HTML FAQ 2026: urlop 2 i 5 stycznia daje wypoczynek 1–6 stycznia; urlop 21–23 grudnia daje wypoczynek 19–27 grudnia.

## Po publikacji

Uruchomić `node scripts/check-live-seo.mjs`, sprawdzić ewentualny cache i reguły Cloudflare oraz przesłać sitemap i kluczowe adresy w Google Search Console. Testy lokalne nie potwierdzają stanu produkcji ani pozycji w wyszukiwarce.
