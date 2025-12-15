# Analiza Klas Świątecznych - 30 Lat Danych (2015-2044)

## Podsumowanie

Ten dokument opisuje analizę systemu oceniania jakości roku dla polskiego kalendarza świąt na podstawie 30 lat danych (2015-2044). System ocen A-I ocenia lata według liczby efektywnych dni wolnych, mostków i świąt straconych w weekendy.

## Kluczowe Ustalenia

### 🏆 Najlepsze Lata: **2030 i 2041** 
- **Tryb sobót do odebrania**: 17 punktów (ocena A)
- **Tryb sobót wolnych**: 17 punktów (ocena A)
- **Dlaczego najlepsze**:
  - Najwięcej dni wolnych w tygodniu: 11
  - Najwięcej mostków: 6 (po poprawce błędu w kalkulacji)
  - Najmniej świąt straconych w weekendy: 3
  - To idealne lata dla planowania urlopów!

### ⚠️ Najgorszy Rok: **2020**
- **Tryb sobót do odebrania**: 8 punktów (ocena I)
- **Tryb sobót wolnych**: 10 punktów (ocena I)
- **Dlaczego najgorszy**:
  - Najmniej dni wolnych w tygodniu: 7
  - Najmniej mostków: 1
  - Najwięcej świąt straconych w weekendy: 4
  - To był trudny rok dla planowania urlopów

## Metodologia Oceniania

### Wzór Oceny

#### Tryb: Soboty Do Odebrania (NOT_COMPENSATED)
```
Score = dni_wolne_w_tygodniu + mostki
```

Gdzie:
- **dni_wolne_w_tygodniu** = liczba świąt państwowych wypadających w poniedziałek-piątek
- **mostki** = dni robocze sąsiadujące ze świętami (piątek po czwartkowym święcie lub poniedziałek przed wtorkowym świętem)

#### Tryb: Soboty Wolne (COMPENSATED)
```
Score = dni_wolne_w_tygodniu + soboty_wolne + mostki
```

Gdzie:
- **dni_wolne_w_tygodniu** = liczba świąt państwowych wypadających w poniedziałek-piątek
- **soboty_wolne** = liczba świąt państwowych wypadających w soboty (które normalnie byłyby dniami pracy)
- **mostki** = dni robocze sąsiadujące ze świętami (piątek po czwartkowym święcie lub poniedziałek przed wtorkowym świętem)

### Mapowanie Punktów na Oceny

System używa 9 klas (A-I), gdzie:
- **A** = najlepsze (najwięcej punktów)
- **E** = średnie
- **I** = najgorsze (najmniej punktów)

Punkty są normalizowane w zakresie od najgorszego do najlepszego roku i równomiernie rozdzielane na 9 klas.

## Szczegółowe Wyniki

### Tryb: Soboty Do Odebrania

| Pozycja | Rok  | Score | Dni Wolne | Mostki | Stracone | Ocena |
|---------|------|-------|-----------|--------|----------|-------|
| 1 (najgorszy) | 2020 | 8 | 7 | 1 | 4 | I |
| 2 | 2021 | 9 | 7 | 2 | 4 | H |
| 3 | 2015 | 10 | 7 | 3 | 4 | G |
| ... | ... | ... | ... | ... | ... | ... |
| 28 | 2029 | 16 | 10 | 5 | 3 | B |
| 29 | 2030 | 17 | 11 | 6 | 3 | A |
| 30 (najlepszy) | 2041 | 17 | 11 | 6 | 3 | A |

**Zakres punktów**: 8 - 17 (rozpiętość: 9 punktów)

### Tryb: Soboty Wolne

| Pozycja | Rok  | Score | Dni Wolne | Soboty | Mostki | Stracone | Ocena |
|---------|------|-------|-----------|--------|--------|----------|-------|
| 1 (najgorszy) | 2020 | 10 | 7 | 2 | 1 | 4 | I |
| 2 | 2021 | 11 | 7 | 2 | 2 | 4 | H |
| 3 | 2015 | 12 | 7 | 2 | 3 | 4 | G |
| ... | ... | ... | ... | ... | ... | ... | ... |
| 27 | 2029 | 16 | 10 | 1 | 5 | 3 | B |
| 28 | 2035 | 16 | 10 | 1 | 5 | 3 | B |
| 29 | 2030 | 17 | 11 | 0 | 6 | 3 | A |
| 30 (najlepszy) | 2041 | 17 | 11 | 0 | 6 | 3 | A |

**Zakres punktów**: 10 - 17 (rozpiętość: 7 punktów)

## Dystrybucja Ocen

### Tryb: Soboty Do Odebrania
- **Klasa A**: 2 lata (2030, 2041)
- **Klasa B**: 3 lata (2018, 2029, 2035)
- **Klasa C**: 8 lat (2019, 2024, 2025, 2028, 2031, 2036, 2040, 2042)
- **Klasa D**: 3 lata (2032, 2033, 2039)
- **Klasa E**: 0 lat
- **Klasa F**: 8 lat (2017, 2022, 2023, 2026, 2034, 2037, 2043, 2044)
- **Klasa G**: 4 lata (2015, 2016, 2027, 2038)
- **Klasa H**: 1 rok (2021)
- **Klasa I**: 1 rok (2020)

### Tryb: Soboty Wolne
- **Klasa A**: 2 lata (2030, 2041)
- **Klasa B**: 3 lata (2018, 2029, 2035)
- **Klasa C**: 8 lat (2019, 2024, 2025, 2028, 2031, 2036, 2040, 2042)
- **Klasa D**: 3 lata (2032, 2033, 2039)
- **Klasa E**: 0 lat
- **Klasa F**: 8 lat (2017, 2022, 2023, 2026, 2034, 2037, 2043, 2044)
- **Klasa G**: 4 lata (2015, 2016, 2027, 2038)
- **Klasa H**: 1 rok (2021)
- **Klasa I**: 1 rok (2020)

## Kluczowe Obserwacje

### 1. Wpływ Wigilii (od 2025)
- Lata 2015-2024: **13 świąt państwowych**
- Lata 2025-2044: **14 świąt państwowych** (dodano Wigilię)
- Wigilia jako dzień wolny od pracy została wprowadzona od 2025 roku

### 2. Czynniki Wpływające na Ocenę
**Pozytywne**:
- Święta wypadające w poniedziałek-piątek
- Święta w czwartek lub wtorek (tworzą mostki)
- Mało świąt w weekendy

**Negatywne**:
- Święta wypadające w soboty lub niedziele (stracone)
- Święta w środku tygodnia bez możliwości mostka
- Mało dni wolnych w tygodniu

### 3. Poprawka Błędu w Kalkulacji Mostków (Grudzień 2024)
Wykryto i naprawiono błąd w algorytmie kalkulacji mostków:
- **Stary algorytm**: Wykrywał tylko mostki przylegające do pojedynczych świąt (wtorek→poniedziałek, czwartek→piątek)
- **Nowy algorytm**: Dodatkowo wykrywa mostki MIĘDZY dwoma świętami oddzielonymi jednym dniem roboczym
- **Przykład**: Majówka - gdy 1 maja (środa) i 3 maja (piątek) są rozdzielone dniem roboczym, 2 maja jest mostkiem
- **Wpływ**: 12 lat (2017, 2018, 2019, 2023, 2024, 2028, 2029, 2030, 2034, 2035, 2040, 2041) zyskało po 1 dodatkowym mostku (2 maja)
- Wszystkie statystyki zostały ponownie przeliczone z poprawionym algorytmem

### 4. Lata z Najlepszym Rozkładem Świąt
Najwięcej mostków (6 dni):
- 2030
- 2041

Najmniej świąt straconych w weekendy (2 dni):
- 2024
- 2025
- 2031
- 2042

## Implementacja w Kodzie

System oceniania jest zaimplementowany w pliku `app.js`:

```javascript
// Obliczanie wyniku (score)
function computeScore(stats, satMode) {
  let score = stats.weekday + stats.bridges;
  if (satMode === window.SAT_MODE.COMPENSATED) {
    score += stats.saturday;
  }
  return score;
}

// Mapowanie wyniku na klasę A-I
function mapScoreToGrade(score, minScore, maxScore) {
  if (minScore === maxScore) {
    return 'E'; // Środkowa klasa
  }
  
  const grades = ['I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
  const range = maxScore - minScore;
  const normalizedScore = (score - minScore) / range; // 0.0 do 1.0
  const gradeIndex = Math.min(grades.length - 1, Math.floor(normalizedScore * grades.length));
  
  return grades[gradeIndex];
}
```

## Wnioski

1. **System ocen działa prawidłowo** - rozróżnia wyraźnie najlepsze i najgorsze lata
2. **2030 i 2041 to idealne lata** dla planowania urlopów z maksymalną liczbą efektywnych dni wolnych (17 punktów, 6 mostków)
3. **2020 był wyjątkowo trudny** - najmniej możliwości na długie weekendy i mostki (zaledwie 1 mostek)
4. **Wigilia od 2025** daje niewielką przewagę latom 2025-2044, ale nie zmienia to zasadniczo rankingu
5. **Rozkład świąt w tygodniu** ma największy wpływ na ocenę - nie tylko liczba świąt, ale ich umiejscowienie
6. **Majówka** (1 i 3 maja) często tworzy mostek na 2 maja, gdy te święta przypadają w odpowiednich dniach tygodnia

## Rekomendacje

Dla użytkowników planujących długoterminowo:
- **Priorytetyzuj urlopy w latach klasy A-C** (2018, 2019, 2024, 2025, 2028, 2029, 2030, 2031, 2035, 2036, 2040, 2041, 2042)
- **Unikaj długich urlopów w latach klasy H-I** (2020, 2021) jeśli to możliwe
- **Wykorzystuj mostki** - to kluczowy element maksymalizacji wolnego czasu
- **Sprawdzaj Boże Ciało** - jako święto ruchome może tworzyć doskonałe mostki
- **Planuj majówkę** - gdy 1 i 3 maja przypadają we właściwych dniach, 2 maja jest idealnym dniem na urlop

## Data Analizy
Ostatnia aktualizacja: Grudzień 2024 (z poprawką błędu kalkulacji mostków)
Dane źródłowe: `data/holidays-pl-2015-2044.json` (30 lat danych)
