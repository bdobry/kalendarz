import { describe, it, expect } from 'vitest';
import { generateCalendarData, getYearStats } from './dateUtils';
import { DayType } from '../types';

describe('Efficiency Algorithm Tests', () => {

  // Test 1: Weryfikacja matematyki na znanych latach
  // 2024 był rokiem przestępnym, święta wypadały średnio.
  it('correctly calculates stats for 2024 (baseline)', () => {
    const data = generateCalendarData(2024);
    const stats = getYearStats(data, false); // Bez odbioru za sobotę

    // W 2024:
    // 13 świąt łącznie
    // 10 dni roboczych
    // 2 soboty (Trzech Króli, Święto Niepodległości) -> -2 pkt
    // 1 niedziela (Wielkanoc) -> -3 pkt
    // Kilka długich weekendów
    
    expect(stats.totalHolidays).toBe(13);
    // Sprawdźmy czy wynik mieści się w oczekiwanych ramach (sanity check)
    expect(stats.efficiencyScore).toBeGreaterThan(0);
    expect(stats.efficiencyScore).toBeLessThan(100);
  });

  // Test 2: Weryfikacja wpływu odbioru dnia wolnego
  it('boosts score when saturdays are redeemed', () => {
    const data = generateCalendarData(2024); // 2 święta w sobotę
    const statsDefault = getYearStats(data, false);
    const statsRedeemed = getYearStats(data, true);

    // Różnica w algorytmie:
    // False: -1 pkt za każdą sobotę
    // True: +4 pkt za każdą sobotę (traktowane jak dzień roboczy + benefit)
    // Delta powinna wynosić: holidaysOnSaturdays * 5
    
    const saturdayHolidays = statsDefault.holidaysOnSaturdays;
    const diff = statsRedeemed.efficiencyScore - statsDefault.efficiencyScore;

    expect(saturdayHolidays).toBeGreaterThan(0);
    expect(diff).toBe(saturdayHolidays * 5);
  });

  // Test 3: Analiza Rozkładu (Distribution Analysis)
  // To jest najważniejszy test dla Ciebie. Wypisze w konsoli histogram.
  it('prints efficiency distribution for 1991-2099', () => {
    const startYear = 1991;
    const endYear = 2099;
    const totalYears = endYear - startYear + 1;
    
    const distribution: Record<string, number> = {
      'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'F': 0, 'G': 0
    };

    const scores: number[] = [];

    for (let y = startYear; y <= endYear; y++) {
      const data = generateCalendarData(y);
      const stats = getYearStats(data, false); // Domyślnie UoP bez odbioru, najtrudniejszy wariant
      distribution[stats.efficiencyClass]++;
      scores.push(stats.efficiencyScore);
    }

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    console.log('\n--- RAPORT EFEKTYWNOŚCI ŚWIĄTECZNEJ (1991-2099) ---');
    console.log(`Średni wynik: ${avgScore.toFixed(2)}`);
    console.log(`Min: ${minScore} | Max: ${maxScore}`);
    console.log('Rozkład klas (Oczekujemy krzywej dzwonowej, a pewnie jest skos):\n');

    Object.entries(distribution).forEach(([cls, count]) => {
      const percentage = ((count / totalYears) * 100).toFixed(1);
      const barLength = Math.round(count / 2); // Skalowanie paska
      const bar = '█'.repeat(barLength);
      console.log(`${cls} | ${String(count).padStart(3)} (${percentage}%) | ${bar}`);
    });
    console.log('-----------------------------------------------------\n');

    // Ten test zawsze przechodzi, służy do podglądu danych
    expect(true).toBe(true);
  });
});
