# SEO i karty udostępniania — 18.09.2026

## Intencja strony, nie lista słów kluczowych

Każdy istniejący adres ma własny tytuł, opis i grafikę udostępniania. Nie dodajemy osobnych, ubogich stron dla wariantów tej samej frazy.

| Strona | Intencja | Treść potwierdzająca opis |
| --- | --- | --- |
| `/` | Marka, kalendarz dni wolnych, wybór roku | Wprowadzenie do kalendarza, święta i mostki, przejście do planera |
| `/{rok}/` | Dni wolne, długie weekendy, majówka, kiedy wziąć urlop | Kalendarz, strategie, rzeczywiste daty świąt i dni do wniosku |
| `/kalkulator-urlopu/` | Osobisty kalendarz urlopowy, koszt wyjazdu w dniach urlopu, bilans | Planer, zakres dat, pula dni, nadchodząca przerwa i eksport ICS |
| `/planer-krwiodawcy/` | Kalendarz donacji krwi i osocza, historia i odstępy | Osobny dashboard, historia, limity i kalendarz donacji |

Tytuły wyszukiwania są opisowe. Krótsze tytuły i opisy Open Graph/Twitter mają ton aplikacji, np. „Planer urlopu. Cały plan w jednym miejscu.” Nie zmieniamy nazwy produktu na „kalkulator”, nawet gdy istniejący adres zawiera to słowo.

Roczniki pokazują od razu przykład przy Bożym Ciele, z datami pochodzącymi z tego samego źródła co kalendarz. W 2026 roku to 4–7 czerwca z urlopem 5 czerwca; w 2027 — 27–30 maja z urlopem 28 maja. Opis strony i widoczny wstęp korzystają ze wspólnej funkcji `getYearSearchExample`. Obliczenia zachowują poprawność na granicy miesięcy oraz w różnych strefach czasowych. Założenie wolnych sobót i niedziel jest widoczne przy przykładzie.

Google dobiera tytuł i fragment opisu automatycznie, również do zapytania. Dlatego „długi weekend” ma konkretną odpowiedź w treści, a „kalendarz urlopowy” prowadzi do narzędzia odpowiadającego tej potrzebie. Nie obiecujemy konkretnego snippetu, pozycji ani dodatkowych linków w wyniku. [Tytuły Google](https://developers.google.com/search/docs/appearance/title-link), [opisy i kontekstowe fragmenty](https://developers.google.com/search/docs/appearance/snippet).

## Dane strukturalne i HTML

- `WebSite` na stronie głównej opisuje nazwę marki i alternatywną pisownię; podstrony odwołują się do jego stałego `@id`. [Nazwy witryn w Google](https://developers.google.com/search/docs/appearance/site-names).
- Każda rzeczywista strona ma `WebPage` i powiązany `ImageObject`. Oba planery mają osobny `WebApplication`, połączony relacją `mainEntity` z odpowiednią stroną.
- Nie dodajemy ocen, fikcyjnych recenzji, nieistniejącej wyszukiwarki ani zdarzeń udających święta. FAQ pozostaje zwykłą, dostępną treścią. Dane opisują narzędzia, nie obiecują wyników rozszerzonych. [Zasady danych strukturalnych](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
- Okruszki nie wracają. Pozostają istniejące canonicale z końcowym ukośnikiem, SSR, indeksowanie roczników od 2024 do roku budowy +5 oraz `noindex` pozostałych roczników i 404.
- Udostępnienie adresu z parametrami lub hashem nadal ma canonical strony publicznej. Osobiste zaznaczenia, bilans i historia donacji nie są częścią metadanych linku.

## Kontrakt grafik

Karty mają format PNG 1200 × 630. Adresy:

- `/og/v2/home.png`
- `/og/v2/planner.png`
- `/og/v2/donor.png`
- `/og/v2/{rok}.png` dla każdego roku 1991–2099, także poza sitemapą

Grafiki powstają podczas budowania strony. HTML zawiera absolutne adresy HTTPS, `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt`, `twitter:image:alt` i `summary_large_image`. Każdy planer oraz rocznik ma własny obraz i opis. [Open Graph — właściwości obrazu](https://ogp.me/).

Sprawdzony podczas analizy [oficjalny adres dokumentacji X Cards](https://developer.x.com/en/docs/twitter-for-websites/cards/overview/markup) przekierowuje obecnie do ogólnego centrum dokumentacji X; nie zawiera już dawnej tabeli znaczników. Zachowujemy istniejącą kompatybilność `twitter:*` i uzupełniamy opis alternatywny. Nie traktujemy stron zewnętrznych jako aktualnej specyfikacji X.

Nowy zestaw favicon udostępnia SVG, PNG 96 × 96, ICO 16/32/48, ikonę Apple 180 × 180 oraz ikony manifestu 192/512. Kolor przeglądarki `theme-color` jest limonkowy (`#d9fa66`), zgodny z manifestem. PNG 96 × 96 przekracza obecne zalecenie Google użycia rozmiaru większego niż 48 × 48. Stałe adresy i dostępność dla crawlerów mają znaczenie; nie wersjonujemy ikon datą każdego buildu. [Favicon w wyszukiwarce](https://developers.google.com/search/docs/appearance/favicon-in-search).

Nowy katalog `/og/v2/` rozdziela grafiki od starej karty. Nie wymusza odświeżenia podglądów już zapisanych przez komunikatory. Po publikacji Google potrzebuje ponownego pobrania stron i ikon.

### Edycja identyfikacji wizualnej

Źródłem kart jest `scripts/share-assets.mjs`: limonkowo-fioletowa paleta, duża typografia i papierowa karta kalendarza nawiązują do landing page'a. Rocznik jest częścią obrazu, a przykładowe bilanse nie korzystają z prywatnego planu użytkownika. Favicon to uproszczone „n.”: atramentowa litera, limonkowe tło i fioletowa kropka; znak pozostaje czytelny przy 16 px.

`scripts/prerender.mjs` generuje wszystkie karty i ikony do `dist` przed kontrolą SEO. Rasteryzacja przez `@resvg/resvg-js` działa bez przeglądarki, systemowych fontów i pobierania plików z sieci. Inter Regular/Bold oraz licencja OFL znajdują się w `assets/brand/fonts`; nie trafiają do bundla aplikacji. Starszy adres `/og/default.png` także otrzymuje aktualny podgląd strony głównej podczas budowania.

Źródło ikony to `public/icons/icon.svg`. Po jego edycji `npm run assets:icons` odświeża małe pliki PNG/ICO w `public`, używane również przez serwer developerski. Podglądy gotowych kart po buildzie znajdują się w `dist/og/v2/`.

## Walidacja

- `utils/seo.test.ts`: routing, granice indeksowania, rozdzielenie intencji, konkretne daty, pełne metadane wszystkich roczników i powiązania JSON-LD.
- `scripts/verify-seo.mjs`: HTML po prerenderze, wszystkie 112 różnych grafik, rzeczywiste sygnatury PNG i wymiary, favicony, manifest, lokalne linki, canonicale, granice roczników i 404. Dla własnego generatora ICO dodatkowo sprawdza nagłówek, trzy wpisy, wymiary, ciągłe offsety, długości i kompletne dane PNG 16/32/48. Uruchamiany przez build.
- `e2e/seo.spec.ts`: rzeczywiste odpowiedzi HTTP bez wymagania JS, typ MIME i wymiary obrazów, czytelność treści bez JS, favicony, nawigacja i dotychczasowe regresje SEO.
- `scripts/check-live-seo.mjs`: po publikacji sprawdza serwer produkcyjny, przekierowania, canonicale, nowe karty, HTTP MIME obrazów i favicon. Nie służy do publikowania ani zmieniania Search Console.

Nie publikowano strony w ramach tego zadania. Kontrolę nowego wydania na produkcji należy uruchomić po jego wdrożeniu: `node scripts/check-live-seo.mjs`.
