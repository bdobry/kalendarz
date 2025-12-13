# Kalendarz Polski

Prosty, minimalistyczny kalendarz internetowy dla polskiego rynku.

## Opis

To jest podstawowa strona internetowa z kalendarzem, zbudowana z wykorzystaniem minimalnej liczby zewnętrznych bibliotek. Całość zawarta jest w jednym pliku HTML z wbudowanymi stylami CSS i JavaScriptem.

## Funkcje

- 📅 Wyświetlanie bieżącej daty
- 🗓️ Interaktywny kalendarz miesięczny
- 🇵🇱 Polska lokalizacja (nazwy miesięcy i dni tygodnia)
- ⬅️➡️ Nawigacja między miesiącami
- 🎨 Nowoczesny, responsywny design
- 💻 Działa bez połączenia z internetem
- 🚀 Brak zewnętrznych zależności

## Jak uruchomić

### Metoda 1: Bezpośrednio w przeglądarce
Po prostu otwórz plik `index.html` w przeglądarce internetowej.

### Metoda 2: Lokalny serwer HTTP
```bash
python3 -m http.server 8080
```
Następnie otwórz przeglądarkę i przejdź do `http://localhost:8080`

### Metoda 3: Node.js http-server
```bash
npx http-server
```

## Technologie

- HTML5
- CSS3 (bez frameworków)
- Vanilla JavaScript (bez bibliotek)

## Kompatybilność

Strona działa we wszystkich nowoczesnych przeglądarkach:
- Chrome/Edge (wersja 90+)
- Firefox (wersja 88+)
- Safari (wersja 14+)
- Opera (wersja 76+)

## Struktura projektu

```
kalendarz/
├── index.html    # Główny plik - wszystko w jednym
└── README.md     # Ten plik
```

## Licencja

Projekt open-source. Możesz go swobodnie modyfikować i używać.
