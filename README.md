# Kalendarz Polski

Zaawansowany kalendarz internetowy dla polskiego rynku z funkcjami planowania urlopów, statystykami dni wolnych i systemem etykiet.

## Opis

Aplikacja internetowa z kalendarzem polskich świąt na lata 2025-2034, zbudowana z wykorzystaniem czystego HTML, CSS i JavaScript. Oferuje zaawansowane funkcje analizy dni wolnych, planowania urlopów oraz konfigurowalny system reklam i analityki.

## Funkcje

### 📅 Kalendarz i Święta
- Interaktywny kalendarz roczny (2025-2034)
- Pełna baza polskich świąt państwowych
- Rozróżnienie świąt stałych i ruchomych
- Automatyczna walidacja danych o świętach
- URL z parametrem roku (`?rok=2025`)

### 📊 Statystyki i Analiza
- Inteligentny system oceny roku (A-F)
- Tryb sobót: "do odebrania" vs "wolne"
- Statystyki dni:
  - Wszystkie święta
  - Dni powszednie
  - Soboty i niedziele
  - Mostki (dni pomostowe)
  - Efektywne dni wolne
  - Stracone święta (wypadające w weekend)

### 🏖️ Planowanie Urlopów
- System etykiet do oznaczania dni
- Licznik dni urlopowych
- Rozróżnienie urlopu z poprzedniego i bieżącego roku
- Przycisk "Wyczyść wszystko"
- Trwałe zapisywanie stanu w localStorage

### 🎨 Interfejs
- Nowoczesny, responsywny design
- Gradientowe tło i stylizacja
- Trzy kolumny: statystyki, kalendarz, etykiety
- Kolorowe oznaczenia dni (święta, soboty, niedziele, mostki)
- Intuicyjna nawigacja między latami

### 🔐 Prywatność i Zgoda
- Banner zgody (GDPR compliant)
- Obsługa akceptacji/odrzucenia zgody
- Zapisywanie preferencji użytkownika
- Warunkowe ładowanie funkcji wymagających zgody

### 📈 Analityka (opcjonalna)
- Wsparcie dla Plausible Analytics
- Wsparcie dla Google Analytics 4 (GA4)
- Konfiguracja poprzez `config.js`
- Pełna zgodność z GDPR

### 💰 Reklamy (opcjonalne)
- Trzy sloty reklamowe (górny, boczny, dolny)
- Tryb reklam statycznych (własne grafiki)
- Przygotowanie pod Google AdSense
- Kontrola per-slot (włącz/wyłącz)
- Walidacja URL i zabezpieczenia XSS
- Respektowanie zgody użytkownika

### ⚙️ Konfiguracja
- Plik `config.js` do zarządzania ustawieniami
- Konfiguracja kolorów motywu
- Ustawienia domyślne (rok, tryb sobót, ocena)
- Łatwa personalizacja bez zmiany kodu

## Szybki Start

### Metoda 1: Bezpośrednio w przeglądarce
```bash
# Otwórz plik index.html w przeglądarce
open index.html  # macOS
xdg-open index.html  # Linux
start index.html  # Windows
```

### Metoda 2: Lokalny serwer HTTP (zalecane)
```bash
# Python 3
python3 -m http.server 8080

# Następnie otwórz: http://localhost:8080
```

### Metoda 3: Node.js http-server
```bash
npx http-server
# Domyślnie: http://localhost:8080
```

### Nawigacja z Parametrem Roku
Dodaj parametr `?rok=YYYY` do URL aby otworzyć konkretny rok:
```
http://localhost:8080?rok=2026
```

## Konfiguracja

Aplikacja jest w pełni konfigurowalna poprzez plik `config.js`. Możesz dostosować:

### Podstawowe Ustawienia
```javascript
defaultYear: 2025,           // Domyślny rok
defaultSaturdayMode: 'NOT_COMPENSATED',  // Tryb sobót
defaultGrade: 'A',           // Domyślna ocena
locale: 'pl-PL',             // Lokalizacja
consentRequired: true        // Wymóg zgody
```

### Kolory Motywu
```javascript
colors: {
  primary: '#667eea',        // Kolor główny
  secondary: '#764ba2',      // Kolor drugorzędny
  holiday: '#e74c3c',        // Święta
  saturday: '#3498db',       // Soboty
  sunday: '#e67e22',         // Niedziele
  bridge: '#f39c12'          // Mostki
}
```

### Reklamy (Opcjonalnie)
```javascript
ads: {
  enabled: true,             // Włącz/wyłącz reklamy
  provider: 'static',        // 'static', 'adsense', 'none'
  static: {
    slots: {
      top: { enabled: true, link: '...', image: '...' },
      sidebar: { enabled: true, link: '...', image: '...' },
      bottom: { enabled: true, link: '...', image: '...' }
    }
  }
}
```

### Analityka (Opcjonalnie)
```javascript
analytics: {
  provider: 'plausible',     // 'plausible', 'ga4', 'none'
  plausible: {
    domain: 'example.com',
    src: 'https://plausible.io/js/script.js'
  },
  ga4: {
    measurementId: 'G-XXXXXXXXXX'
  }
}
```

Więcej szczegółów w pliku `config.js`.

## Technologie

- **HTML5** - Struktura strony
- **CSS3** - Stylizacja (bez frameworków)
- **Vanilla JavaScript** - Logika aplikacji (bez bibliotek)
- **JSON** - Dane o świętach (2025-2034)
- **localStorage** - Trwałe zapisywanie stanu

## Bezpieczeństwo

Aplikacja implementuje następujące zabezpieczenia:

- ✅ Walidacja URL (tylko http/https)
- ✅ Ochrona przed XSS (bezpieczna manipulacja DOM)
- ✅ Bezpieczne atrybuty linków (noopener noreferrer)
- ✅ Walidacja danych wejściowych
- ✅ Brak użycia innerHTML dla zewnętrznych danych

## Kompatybilność

Aplikacja działa we wszystkich nowoczesnych przeglądarkach:
- ✅ Chrome/Edge (wersja 90+)
- ✅ Firefox (wersja 88+)
- ✅ Safari (wersja 14+)
- ✅ Opera (wersja 76+)
- ✅ Pełna responsywność mobilna

## Struktura Projektu

```
kalendarz/
├── index.html              # Główny plik HTML
├── app.js                  # Logika aplikacji (~1400 linii)
├── config.js               # Konfiguracja aplikacji
├── styles.css              # Stylizacja CSS
├── data/
│   └── holidays-pl-2025-2034.json  # Baza świąt (10 lat)
├── test-ads.html           # Testy systemu reklam
├── test-consent.html       # Testy banneru zgody
├── README.md               # Ten plik
└── README-PR9.md           # Dokumentacja PR9 (reklamy)
```

## Funkcje Kluczowe

### System Oceniania Roku
Aplikacja automatycznie ocenia "jakość" roku (A-F) na podstawie:
- Liczby efektywnych dni wolnych
- Mostków do wykorzystania
- Świąt wypadających w weekendy
- Trybu sobót (do odebrania vs wolne)

### System Etykiet
- Twórz własne etykiety (np. "Urlop", "Wyjazd")
- Przypisuj je do wybranych dni
- Automatyczne liczenie dni dla każdej etykiety
- Podgląd wykorzystania urlopu

### Statystyki
Automatyczne obliczanie:
- **Wszystkie święta** - Suma dni świątecznych w roku
- **Dni powszednie** - Dni robocze (poniedziałek-piątek bez świąt)
- **Soboty** - Liczba sobót (z uwzględnieniem trybu)
- **Niedziele** - Liczba niedziel
- **Mostki** - Dni pomostowe (piątek/poniedziałek między świętem a weekendem)
- **Efektywne dni wolne** - Święta + niedziele + soboty wolne
- **Stracone święta** - Święta wypadające w soboty/niedziele

## Testowanie

Dostępne pliki testowe:
- **test-ads.html** - Interaktywne testy systemu reklam
- **test-consent.html** - Testy banneru zgody GDPR

## FAQ

### Jak wyłączyć reklamy?
W `config.js` ustaw:
```javascript
ads: { enabled: false }
```

### Jak wyłączyć analitykę?
W `config.js` ustaw:
```javascript
analytics: { provider: 'none' }
```

### Gdzie są zapisywane dane użytkownika?
Wszystkie dane (etykiety, wybrane dni, preferencje) są zapisywane lokalnie w przeglądarce (localStorage). Nic nie jest wysyłane na serwer.

### Jak dodać własne święta?
Edytuj plik `data/holidays-pl-2025-2034.json` i dodaj wpisy w formacie:
```json
{"date": "YYYY-MM-DD", "name": "Nazwa", "type": "fixed"}
```

## Dokumentacja Szczegółowa

Szczegółowa dokumentacja funkcji znajduje się w:
- **README-PR9.md** - System reklam i AdSense
- **config.js** - Wszystkie opcje konfiguracyjne
- **Komentarze w kodzie** - Dokumentacja funkcji w app.js

## Licencja

Projekt open-source. Możesz go swobodnie modyfikować i używać.

## Historia Wersji

Ostatnie główne funkcje:
- **PR9** - System reklam (static, AdSense)
- **PR8** - Analityka (Plausible, GA4)
- **PR7** - Banner zgody GDPR
- **PR6** - System etykiet i urlopów
- **PR5** - Statystyki i oceny roku
- **PR4** - Tryb sobót
- **PR3** - Nawigacja lat z URL
- **PR2** - Walidacja danych
- **PR1** - Podstawowy kalendarz

Więcej szczegółów w historii commitów.
