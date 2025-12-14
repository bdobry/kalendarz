# Analiza Klas Świątecznych - 20 Lat Danych (2015-2034)

## Podsumowanie

Ten dokument opisuje analizę systemu oceniania jakości roku dla polskiego kalendarza świąt na podstawie 20 lat danych (2015-2034). System ocen A-I ocenia lata według liczby efektywnych dni wolnych, mostków i świąt straconych w weekendy.

## Kluczowe Ustalenia

### 🏆 Najlepszy Rok: **2030** 
- **Tryb sobót do odebrania**: 16 punktów (ocena A)
- **Tryb sobót wolnych**: 16 punktów (ocena A)
- **Dlaczego najlepszy**:
  - Najwięcej dni wolnych w tygodniu: 11
  - Najwięcej mostków: 5
  - Najmniej świąt straconych w weekendy: 3
  - To idealny rok dla planowania urlopów!

### ⚠️ Najgorszy Rok: **2020**
- **Tryb sobót do odebrania**: 8 punktów (ocena I)
- **Tryb sobót wolnych**: 10 punktów (ocena I)
- **Dlaczego najgorszy**:
  - Najmniej dni wolnych w tygodniu: 7
  - Najmniej mostków: 1
  - Najwięcej świąt straconych w weekendy: 6
  - To był trudny rok dla planowania urlopów

## Metodologia Oceniania

### Wzór Oceny

#### Tryb: Soboty Do Odebrania (NOT_COMPENSATED)
```
Score = dni_wolne_w_tygodniu + mostki
```

#### Tryb: Soboty Wolne (COMPENSATED)
```
Score = dni_wolne_w_tygodniu + soboty_wolne + mostki
```

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
| 1 (najgorszy) | 2020 | 8 | 7 | 1 | 6 | I |
| 2 | 2021 | 9 | 7 | 2 | 6 | H |
| 3 | 2015 | 10 | 7 | 3 | 6 | G |
| ... | ... | ... | ... | ... | ... | ... |
| 18 | 2019 | 14 | 10 | 4 | 3 | C |
| 19 | 2029 | 14 | 10 | 4 | 4 | C |
| 20 (najlepszy) | 2030 | 16 | 11 | 5 | 3 | A |

**Zakres punktów**: 8 - 16 (rozpiętość: 8 punktów)

### Tryb: Soboty Wolne

| Pozycja | Rok  | Score | Dni Wolne | Soboty | Mostki | Stracone | Ocena |
|---------|------|-------|-----------|--------|--------|----------|-------|
| 1 (najgorszy) | 2020 | 10 | 7 | 2 | 1 | 6 | I |
| 2 | 2021 | 11 | 7 | 2 | 2 | 6 | H |
| 3 | 2015 | 12 | 7 | 2 | 3 | 6 | F |
| ... | ... | ... | ... | ... | ... | ... | ... |
| 18 | 2029 | 15 | 10 | 1 | 4 | 4 | B |
| 19 | 2031 | 15 | 10 | 2 | 3 | 4 | B |
| 20 (najlepszy) | 2030 | 16 | 11 | 0 | 5 | 3 | A |

**Zakres punktów**: 10 - 16 (rozpiętość: 6 punktów)

## Dystrybucja Ocen

### Tryb: Soboty Do Odebrania
- **Klasa A**: 1 rok (2030)
- **Klasa B**: 0 lat
- **Klasa C**: 3 lata (2018, 2019, 2029)
- **Klasa D**: 3 lata (2024, 2025, 2031)
- **Klasa E**: 5 lat (2016, 2022, 2028, 2032, 2033)
- **Klasa F**: 4 lata (2017, 2023, 2026, 2034)
- **Klasa G**: 2 lata (2015, 2027)
- **Klasa H**: 1 rok (2021)
- **Klasa I**: 1 rok (2020)

### Tryb: Soboty Wolne
- **Klasa A**: 1 rok (2030)
- **Klasa B**: 4 lata (2018, 2025, 2029, 2031)
- **Klasa C**: 5 lat (2019, 2024, 2028, 2032, 2033)
- **Klasa D**: 0 lat
- **Klasa E**: 2 lata (2022, 2026)
- **Klasa F**: 6 lat (2015, 2016, 2017, 2023, 2027, 2034)
- **Klasa G**: 0 lat
- **Klasa H**: 1 rok (2021)
- **Klasa I**: 1 rok (2020)

## Kluczowe Obserwacje

### 1. Wpływ Wigilii (od 2025)
- Lata 2015-2024: **13 świąt państwowych**
- Lata 2025-2034: **14 świąt państwowych** (dodano Wigilię)
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

### 3. Lata z Ekstremalną Liczbą Straconych Świąt
Najwięcej świąt straconych w weekendy (6 dni):
- 2015
- 2020
- 2021
- 2026
- 2027
- 2032
- 2033

### 4. Lata z Najlepszym Rozkładem Świąt
Najmniej świąt straconych w weekendy (3 dni):
- 2019
- 2024
- 2030

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
2. **2030 to idealny rok** dla planowania urlopów z maksymalną liczbą efektywnych dni wolnych
3. **2020 był wyjątkowo trudny** - najmniej możliwości na długie weekendy i mostki
4. **Wigilia od 2025** daje niewielką przewagę latom 2025-2034, ale nie zmienia to zasadniczo rankingu
5. **Rozkład świąt w tygodniu** ma największy wpływ na ocenę - nie tylko liczba świąt, ale ich umiejscowienie

## Rekomendacje

Dla użytkowników planujących długoterminowo:
- **Priorytetyzuj urlopy w latach klasy A-C** (2018, 2019, 2024, 2025, 2029, 2030, 2031)
- **Unikaj długich urlopów w latach klasy H-I** (2020, 2021) jeśli to możliwe
- **Wykorzystuj mostki** - to kluczowy element maksymalizacji wolnego czasu
- **Sprawdzaj Boże Ciało** - jako święto ruchome może tworzyć doskonałe mostki

## Data Analizy
Ostatnia aktualizacja: Grudzień 2024
Dane źródłowe: `data/holidays-pl-2015-2034.json`
