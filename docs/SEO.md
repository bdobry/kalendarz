# SEO nierobie.pl — wdrożenie i plan fraz

Stan analizy: 14 września 2026. Zmiany w repozytorium wymagają opublikowania przez istniejący workflow GitHub Pages. Pozycje w Google i indeksacja nie są gwarantowane; nie mamy danych Search Console ani wolumenów z Keyword Plannera.

## Aktualizacja produktu — 18 września 2026

`/kalkulator-urlopu/` zachowuje swój adres i przechodzi w dashboard planera urlopu: bilans, przerwy, dodawanie zakresu i współdzielony kalendarz. Szybkie zaznaczanie urlopu pozostaje na stronach rocznych. `/planer-krwiodawcy/` jest odrębnym narzędziem do donacji krwi i osocza, z własnym H1, metadanymi, canonicalem, WebApplication, statycznym HTML i wpisem w sitemap. Oba planery łączą się nawigacją i korzystają z tego samego lokalnego zapisu. Intencja nowej strony to „planer krwiodawcy / kalendarz donacji”; nie szacujemy jej ruchu bez danych. Uzasadnienie podziału i research: [planner-redesign.md](planner-redesign.md).

Poniżej zachowano analizę pierwotnego wdrożenia. Aktualną strukturę publikacji sprawdzają `scripts/prerender.mjs`, `scripts/verify-seo.mjs` i `scripts/check-live-seo.mjs`.

## Potwierdzona przyczyna

Bezpośrednie żądania do produkcji `/2026`, `/2026/` i `/2027` zwracały HTTP **404**. `/` zwracał 200 z pustym `#root`, opisem odnoszącym się do 2025 i skryptem Tailwind CDN. Build kopiował `index.html` do `404.html`, a React dopiero po uruchomieniu tworzył treść i metadane. Zmiana `/` na bieżący rok była realizowana przez `history.pushState`, a nie redirect HTTP. Stary kod nie synchronizował kalendarza z historią przeglądarki.

Google potrafi renderować JavaScript. Problemem nie jest sam React, lecz m.in. odpowiedź 404, brak treści w początkowym HTML i sygnały kanoniczne zależne od JS. [Dokumentacja Google](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Rozwiązanie

- Build Vite + renderowanie React do HTML: `dist/2026/index.html`, `dist/2027/index.html` i wszystkie lata obsługiwane dotychczas (1991–2099). Bez serwera aplikacyjnego i bez zmiany hostingu.
- Trwała, odrębna strona `/`: marka nierobie.pl, wybór roku, opis narzędzi i odnośnik do kalkulatora.
- `/kalkulator-urlopu/`: działający kalkulator liczby dni urlopu między datami, z odliczeniem weekendów i polskich świąt. Oba końce okresu są wliczone. Zakres lat 2024–2099, maksymalnie 366 dni; terminy przyszłe według obecnych zasad świąt. Nie wylicza kosztów podróży ani nabytego wymiaru urlopu.
- Każda strona ma własny title, description, H1, canonical, Open Graph, Twitter Card oraz JSON-LD WebSite/WebPage; kalkulator ma dodatkowo WebApplication. Nie używamy breadcrumbs w interfejsie ani BreadcrumbList w danych strukturalnych. Bez fikcyjnych ocen, gwiazdek i obietnic FAQ rich results.
- Canonicale i linki używają końcowego `/`, zgodnie ze strukturą katalogową. Standardowy hosting statyczny kieruje `/2026` do `/2026/`; należy potwierdzić zachowanie na produkcji po publikacji, zwłaszcza przy regułach Cloudflare.
- React hydratuje ten sam HTML, który otrzymują użytkownicy i roboty. Strategie i święta są obecne przed wykonaniem JS. Rok builda jest zapisany w HTML; oznaczenie dzisiejszej daty włącza się po hydratacji.
- Nieznane adresy otrzymują prawdziwą stronę 404 z `noindex, follow`. Nie ma przekierowania błędów na bieżący rok.
- Automatyczny sitemap zawiera tylko opublikowane, indeksowalne canonicale: `/`, kalkulator oraz lata od 2024 do roku builda +5. Pozostałe lata mają `noindex, follow` i pozostają dostępne w interfejsie. Starsze indeksowane roczniki nie znikają z sitemap przy zmianie roku. Dalekie prognozy i archiwalne modele nie mają zajmować miejsca w indeksie.
- Tailwind jest kompilowany do lokalnego CSS z hashem. Wygląd nie wymaga wykonywania skryptu CDN. Zachowana dotychczasowa paleta i komponenty.
- Workflow przed publikacją uruchamia typy, testy jednostkowe, generator, walidację SEO i testy przeglądarkowe. Comiesięczny build odświeża roczniki na stronie głównej i w sitemap. GitHub może opóźnić lub wyłączyć harmonogram w nieaktywnym repozytorium — należy kontrolować Actions.

## Frazy i przypisanie do stron

Priorytety są oceną dopasowania intencji i obserwowanych wyników wyszukiwania, **nie estymacją ruchu, trudności ani wolumenu**. Warianty z latami 2026 i 2027 są dziś najbliższe produktowi; treści na kolejne lata są generowane z faktycznych dat.

| Priorytet | Klaster fraz | Docelowa strona | Uzasadnienie / treść |
| --- | --- | --- | --- |
| P1 | nierobie, nierobie.pl, nie robię kalendarz, nierobie urlop | `/` | Stała nazwa marki, własny tytuł, H1, WebSite i spójny link z kalendarzy. Wariant pisowni to hipoteza do sprawdzenia w GSC. |
| P1 | dni wolne 2027, dni wolne od pracy 2027, kalendarz świąt 2027 | `/2027/` | Dokładna tabela świąt i dni tygodnia, kalendarz oraz podsumowanie roku. Analogicznie `/2026/`. |
| P1 | długie weekendy 2027, kiedy wziąć urlop 2027, jak zaplanować urlop 2027 | `/2027/` | Konkretne daty, koszt w dniach urlopu, długość wypoczynku i porównanie propozycji. |
| P1 | kalkulator dni urlopu, ile dni urlopu między datami, ile urlopu na wakacje | `/kalkulator-urlopu/` | Dokładnie odpowiadają funkcji narzędzia; wynik jest widoczny i weryfikowalny. |
| P2 | majówka 2027 urlop, Boże Ciało 2027 długi weekend, urlop na święta 2027 | Sekcje `/2027/` | Sezonowe pytania i propozycje. Na razie jedna silna strona roczna zamiast wielu podobnych podstron. |
| P2 | planer urlopu, planowanie urlopu, kalendarz urlopowy | `/` i roczniki | Strona główna wyjaśnia funkcje, roczniki realizują planowanie konkretnego roku. |
| P2 | kalkulator wakacji, planowanie wakacji 2027 | Kalkulator i sekcja roczna | Uściślenie: liczymy dni urlopu na wyjazd. Fraza „kalkulator wakacji” obejmuje również koszty i odliczanie. |
| P3 | wakacje, tanie wakacje, wakacje all inclusive | Brak dedykowanej strony | Intencja ofert turystycznych; obecny produkt jej nie realizuje. Nie warto tworzyć treści obiecującej oferty ani upychać tych słów. |
| P3 | kalkulator ekwiwalentu urlopu, urlop proporcjonalny, 20 czy 26 dni | Brak dedykowanej strony | To inna funkcja, związana z uprawnieniami i rozliczeniem. Nie obiecujemy jej w metadanych. |

Obserwacje SERP: [planerurlopu.pl](https://planerurlopu.pl/) łączy planer z dniami roboczymi; [TUI: długie weekendy](https://www.tui.pl/blog/dlugie-weekendy-czyli-jak-najlepiej-zaplanowac-urlop/) i [kalendarz 2027](https://topkalendarz.pl/kalendarz-2027) potwierdzają intencję sezonową i roczną; [kalkulator urlopu zpracy.pl](https://zpracy.pl/kalkulator-urlopu) pokazuje, że ogólna fraza „kalkulator urlopu” może oznaczać wymiar i ekwiwalent. To analiza intencji, bez kopiowania tekstów konkurencji.

Nie dodajemy `meta keywords`: Google ich nie używa. [Google: obsługiwane meta tagi](https://developers.google.com/search/docs/crawling-indexing/special-tags).

## Publikacja: GitHub Pages + Cloudflare

1. Opublikować sprawdzone zmiany w `main` przez normalny proces repozytorium. Workflow publikuje **cały `dist`**, z katalogami lat, `CNAME` i `.nojekyll`. Nie podmieniać buildu ponownie na sam `index.html` i `404.html`.
2. W Cloudflare sprawdzić Redirect Rules, stare Page Rules i ewentualny Worker. `/` ma pozostać 200. Usunąć regułę `/ → bieżący rok`, jeśli istnieje. Podczas diagnozy nie obserwowano takiego przekierowania HTTP, lecz zmianę adresu w kodzie aplikacji.
3. Nie stosować fallbacku wszystkich ścieżek do `/index.html`, redirectu `/* → /` ani przekierowania `/2026/ → /2026`, które przy Pages może tworzyć pętlę. Hosting ma serwować pliki z katalogów.
4. Jeżeli są warianty `www` i HTTP, preferować pojedynczy trwały redirect do `https://nierobie.pl` z zachowaniem ścieżki i query. Weryfikacja domen, DNS i reguł wymaga dostępu do konta.
5. Po udanym deploymentcie wyczyścić cache HTML i starych 404 dla `/`, `/2026`, `/2026/`, `/2027`, `/2027/`, `/kalkulator-urlopu`, `/kalkulator-urlopu/`, `/sitemap.xml`, `/robots.txt` oraz pozostałych opublikowanych roczników. Jeśli nie ustawiono cache HTML, purge może nie być konieczny. [Cloudflare: purge by URL](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-single-file/).
6. Użyć `node scripts/check-live-seo.mjs`, aby sprawdzić publiczne statusy, canonicale i zawartość HTML po CDN. Osobno sprawdzić host `www` i HTTP oraz użyć Rich Results Test do walidacji danych strukturalnych; poprawne dane nie gwarantują rozszerzonego wyniku.
7. W Search Console przesłać `https://nierobie.pl/sitemap.xml`. Sprawdzić URL Inspection dla `/`, `/2026/`, `/2027/` i kalkulatora, wykonać test aktywnego URL oraz poprosić o indeksowanie kluczowych stron. Stare adresy bez `/` powinny być traktowane jako przekierowane warianty.

## Pomiar po wdrożeniu

Zapisać datę publikacji i bazowe wyniki GSC. Po 2–4 tygodniach porównać indeksowane URL-e, wykluczenia 404, canonical wybrany przez Google, wyświetlenia, kliknięcia i CTR. Oddzielić markę (np. `nierobie|nie robię`) od fraz rocznych i kalkulatora. Jeśli wariant z dużą liczbą wyświetleń ma niski CTR, poprawić title/description w obrębie rzeczywistej funkcji. Porównywać podobne okresy sezonu; przed świętem rośnie popyt niezależnie od zmian technicznych.

Nie wpisujemy sztucznych dat `lastmod`, nie mnożymy stron o tej samej treści, nie blokujemy JS/CSS w robots.txt i nie składamy obietnic top 1. [Google: canonicale](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Google: sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [GitHub Pages: 404](https://docs.github.com/en/pages/getting-started-with-github-pages/troubleshooting-404-errors-for-github-pages-sites).

## Liczby roku — 15 września 2026

Sekcja „rok w kilku liczbach” odpowiada dodatkowo na intencje: „ile dni roboczych 2026”, „wymiar czasu pracy 2026”, „godziny pracy 2026”, „ile weekendów / sobót / niedziel w roku” oraz ich warianty miesięczne i roczne. To dobór na podstawie funkcji aplikacji i pytań użytkowników, bez danych o wolumenie wyszukiwań.

Dane powstają z istniejącego kalendarza: wymiar dni i godzin pracy, wolne z odbiorem za sobotę, pełne weekendy, soboty, niedziele, dni świąt i miesięczna tabela. Rozróżniamy dni robocze w kalendarzu od wymiaru pracy po uwzględnieniu sobotnich świąt (2026: 253 → 251 dni, 2008 godzin). Pełny weekend oznacza sobotę i niedzielę mieszczące się w danym roku; dni weekendowych nie utożsamiamy z dwukrotnością tej liczby w latach z niepełnym weekendem na granicy roku. Nie liczymy ponownie świąt wypadających w weekend.

Nagłówki, bezpośrednie odpowiedzi, metodologia i tabela są w statycznym HTML. Miesięczna tabela otwiera się natywnie bez JavaScript. Zachowane ciekawostki obejmują miesiąc z największą liczbą dni wolnych oraz najdłuższą przerwę między świętami. [PIP: sposób obliczania wymiaru czasu pracy](https://www.pip.gov.pl/dla-pracownikow/porady-prawne/czas-pracy). Nie dodajemy nowych stron ani metadanych sugerujących kalkulator uprawnień urlopowych.
