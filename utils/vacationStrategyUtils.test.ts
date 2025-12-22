import { describe, it, expect } from 'vitest';
import { analyzeVacationStrategies, analyzeStrategyStats, VacationOpportunity } from './vacationStrategyUtils';
import { DayType } from '../types';
describe('vacationStrategyUtils', () => {
  describe('analyzeVacationStrategies', () => {
    it('should return an array of vacation opportunities', () => {
      const strategies = analyzeVacationStrategies(2025);
      expect(Array.isArray(strategies)).toBe(true);
    });

    it('should filter strategies by efficiency threshold', () => {
      const strategies = analyzeVacationStrategies(2025);
      // All strategies should meet the base criteria: efficiency > 1.8 OR freeDays >= 5
      strategies.forEach(strategy => {
        expect(
          strategy.efficiency > 1.8 || strategy.freeDays >= 5
        ).toBe(true);
      });
    });

    it('should include required properties for each strategy', () => {
      const strategies = analyzeVacationStrategies(2025);
      if (strategies.length > 0) {
        const strategy = strategies[0];
        expect(strategy).toHaveProperty('id');
        expect(strategy).toHaveProperty('startDate');
        expect(strategy).toHaveProperty('endDate');
        expect(strategy).toHaveProperty('daysToTake');
        expect(strategy).toHaveProperty('vacationDays');
        expect(strategy).toHaveProperty('freeDays');
        expect(strategy).toHaveProperty('efficiency');
        expect(strategy).toHaveProperty('description');
        expect(strategy).toHaveProperty('monthIndex');
      }
    });

    it('should calculate efficiency correctly', () => {
      const strategies = analyzeVacationStrategies(2025);
      strategies.forEach(strategy => {
        const expectedEfficiency = strategy.freeDays / strategy.daysToTake;
        expect(strategy.efficiency).toBeCloseTo(expectedEfficiency, 1);
      });
    });

    it('should have vacationDays array matching daysToTake count', () => {
      const strategies = analyzeVacationStrategies(2025);
      strategies.forEach(strategy => {
        expect(strategy.vacationDays).toHaveLength(strategy.daysToTake);
      });
    });

    it('should have all vacationDays within the strategy date range', () => {
      const strategies = analyzeVacationStrategies(2025);
      strategies.forEach(strategy => {
        strategy.vacationDays.forEach(vacDay => {
          const vacTime = vacDay.getTime();
          expect(vacTime).toBeGreaterThanOrEqual(strategy.startDate.getTime());
          expect(vacTime).toBeLessThanOrEqual(strategy.endDate.getTime());
        });
      });
    });

    it('should have freeDays greater than or equal to daysToTake', () => {
      const strategies = analyzeVacationStrategies(2025);
      strategies.forEach(strategy => {
        expect(strategy.freeDays).toBeGreaterThanOrEqual(strategy.daysToTake);
      });
    });

    it('should have valid monthIndex (0-11)', () => {
      const strategies = analyzeVacationStrategies(2025);
      strategies.forEach(strategy => {
        expect(strategy.monthIndex).toBeGreaterThanOrEqual(0);
        expect(strategy.monthIndex).toBeLessThanOrEqual(11);
      });
    });

    it('should have startDate before or equal to endDate', () => {
      const strategies = analyzeVacationStrategies(2025);
      strategies.forEach(strategy => {
        expect(strategy.startDate.getTime()).toBeLessThanOrEqual(strategy.endDate.getTime());
      });
    });

    it('should generate unique IDs for each strategy', () => {
      const strategies = analyzeVacationStrategies(2025);
      const ids = strategies.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should handle year boundaries correctly', () => {
      // Test that strategies near year end don't cause errors
      const strategies2024 = analyzeVacationStrategies(2024);
      const strategies2025 = analyzeVacationStrategies(2025);
      
      expect(Array.isArray(strategies2024)).toBe(true);
      expect(Array.isArray(strategies2025)).toBe(true);
    });

    it('should identify Majówka (May Day) opportunities in 2025', () => {
      const strategies = analyzeVacationStrategies(2025);
      const mayStrategies = strategies.filter(s => 
        s.description.toLowerCase().includes('maj') || s.monthIndex === 4 || s.periodName === 'Majówka'
      );
      
      // May 2025 has May 1st (Thursday) and May 3rd (Saturday) as holidays
      // Should create opportunities around these dates
      expect(mayStrategies.length).toBeGreaterThan(0);
    });

    it('should identify Christmas/New Year opportunities', () => {
      const strategies = analyzeVacationStrategies(2025);
      const decemberStrategies = strategies.filter(s => s.monthIndex === 11);
      
      // December should have strategies around Christmas/New Year
      expect(decemberStrategies.length).toBeGreaterThan(0);
    });

    it('should have all strategies from the same year', () => {
      const strategies = analyzeVacationStrategies(2025);
      strategies.forEach(strategy => {
        expect(strategy.startDate.getFullYear()).toBe(2025);
      });
    });

    it('should handle leap years correctly', () => {
      const strategies2024 = analyzeVacationStrategies(2024); // Leap year
      const strategies2025 = analyzeVacationStrategies(2025); // Not leap year
      
      // Both should work without errors
      expect(Array.isArray(strategies2024)).toBe(true);
      expect(Array.isArray(strategies2025)).toBe(true);
    });

    it('should have reasonable efficiency values', () => {
      const strategies = analyzeVacationStrategies(2025);
      strategies.forEach(strategy => {
        // Efficiency should be at least 1 (you get at least what you put in)
        expect(strategy.efficiency).toBeGreaterThanOrEqual(1);
        // Efficiency shouldn't be unreasonably high (e.g., > 10)
        expect(strategy.efficiency).toBeLessThan(10);
      });
    });

    it('should have reasonable daysToTake values', () => {
      const strategies = analyzeVacationStrategies(2025);
      strategies.forEach(strategy => {
        // Should take at least 1 day
        expect(strategy.daysToTake).toBeGreaterThanOrEqual(1);
        // Shouldn't require more than typical vacation allowance
        expect(strategy.daysToTake).toBeLessThanOrEqual(26);
      });
    });

    it('should have reasonable freeDays values', () => {
      const strategies = analyzeVacationStrategies(2025);
      strategies.forEach(strategy => {
        // Should have at least 3 free days to be worth it
        expect(strategy.freeDays).toBeGreaterThanOrEqual(3);
        // Shouldn't be unreasonably long (e.g., > 30 days)
        expect(strategy.freeDays).toBeLessThan(30);
      });
    });
    it('should correctly count Bridge days as cost (Workdays) - 2029 Regression', () => {
      // User reported issue in 2029 where May 2 and May 4 were treated as free.
      // 1.05.2029 is Tuesday (Holiday)
      // 3.05.2029 is Thursday (Holiday)
      // Therefore, 2.05 (Wed) and 4.05 (Fri) are Bridge Days.
      // They MUST be counted in daysToTake.
      
      const strategies = analyzeVacationStrategies(2029);
      
      // Find the specific strategy reported: 21 Apr - 6 May
      const specificStrategy = strategies.find(s => 
        s.startDate.getDate() === 21 && 
        s.startDate.getMonth() === 3 && // April (0-indexed)
        s.endDate.getDate() === 6 &&
        s.endDate.getMonth() === 4 // May
      );

      if (specificStrategy) {
         // Reported Cost was 5 (Incorrect -> treated bridges as free).
         // Correct Cost should be: 
         // Apr 23-27 (5 days)
         // Apr 30 (Bridge -> 1 day)
         // May 2 (Bridge -> 1 day)
         // May 4 (Bridge -> 1 day)
         // Total = 8.
         expect(specificStrategy.daysToTake).toBe(8);
      } else {
         throw new Error("Could not find the target strategy (21 Apr - 6 May 2029)");
      }
    });


  });
});

describe('analyzeStrategyStats', () => {
    const mockStrategy: VacationOpportunity = {
        id: 'test-id',
        startDate: new Date('2025-04-20'),
        endDate: new Date('2025-04-25'),
        daysToTake: 4,
        vacationDays: [],
        freeDays: 9,
        efficiency: 2.25,
        description: 'Test Strategy',
        periodName: 'MojOkres',
        monthIndex: 3
    };

    const mockStatsData = {
        'MojOkres': {
            samples: 100,
            maxEfficiency: 2.25,
            efficiencies: [2.0, 2.0, 2.25, 2.25, 1.8], // Mixed
            combinations: {
                '2.25_9': {
                    count: 50, // Frequent (every 2 years approx in 100 years scope? No, logic uses 2100-2024 = 76 years)
                    years: [2025, 2026]
                }
            }
        },
        'ConstantPeriod': {
            samples: 100,
            maxEfficiency: 2.0,
            efficiencies: [2.0, 2.0, 2.0, 2.0], // All same
            combinations: {
                '2.00_9': { count: 80, years: [] } // Very frequent
            }
        },
        'RarePeriod': {
            samples: 100,
            maxEfficiency: 3.0,
            efficiencies: [1.0, 1.0, 1.0, 3.0], // Mostly low, rare high
            combinations: {
                '3.00_9': { count: 1, years: [] } // Very rare
            }
        } 
    };

    it('should identify a constant efficiency period as Standard', () => {
        const strat = { ...mockStrategy, periodName: 'ConstantPeriod', efficiency: 2.0 };
        const result = analyzeStrategyStats(strat, mockStatsData);
        expect(result).not.toBeNull();
        expect(result?.isStandardSequence).toBe(true);
        expect(result?.isRare).toBe(false);
        expect(result?.isBestPossible).toBe(true);
    });

    it('should identify a frequent best possible strategy as Standard (e.g. Easter every year case)', () => {
        // Mock stats where the best efficiency happens every year (count ~76 for 76 years)
        const frequentStats = {
            'FrequentBest': {
                samples: 76, 
                maxEfficiency: 2.25,
                efficiencies: [2.0, 2.25, 2.25], // Mix
                combinations: {
                    '2.25_9': { count: 76, years: [] } // Every year
                }
            }
        };
        const strat = { ...mockStrategy, periodName: 'FrequentBest', efficiency: 2.25 };
        const result = analyzeStrategyStats(strat, frequentStats);
        
        expect(result?.isBestPossible).toBe(true);
        expect(result?.isStandardSequence).toBe(true); // Should be standard because it's frequent best
        expect(result?.isRare).toBe(false);
    });

    it('should identify a rare high efficiency strategy as Rare', () => {
        const strat = { ...mockStrategy, periodName: 'RarePeriod', efficiency: 3.0 };
        const result = analyzeStrategyStats(strat, mockStatsData);
        
        expect(result?.isBestPossible).toBe(true);
        expect(result?.isStandardSequence).toBe(false);
        expect(result?.isRare).toBe(true); // High percentile (better than > 75% or 80%)
    });
    
    it('should handle missing stats gracefully', () => {
        const strat = { ...mockStrategy, periodName: 'NonExistent' };
        const result = analyzeStrategyStats(strat, mockStatsData);
        expect(result).toBeNull();
    });

    it('should find next occurrence based on end year to avoid current year duplicates', () => {
        const spanningStrategy: VacationOpportunity = {
            id: 'span-2046-2047',
            startDate: new Date('2046-12-25'),
            endDate: new Date('2047-01-05'), // Ends in 2047
            daysToTake: 5,
            vacationDays: [],
            freeDays: 12,
            efficiency: 2.4,
            description: 'Boże Narodzenie 2046',
            periodName: 'Boże Narodzenie',
            monthIndex: 11
        };

        const xmasStats = {
           'Boże Narodzenie': {
               samples: 100, 
               maxEfficiency: 3.0, 
               efficiencies: [2.5, 3.0], 
               combinations: {
                   '2.40_12': { // Key matching the strategy
                       count: 10,
                       // Scenario: We have 2040, 2046, 2047, 2053
                       // 2046 is the start year of current strategy.
                       // 2047 is the start year of the NEXT one (Dec 2047).
                       // Since current strategy ENDS in 2047, "Next Occasion" should be strictly > 2047.
                       // So it should skip 2047 and find 2053.
                       years: [2040, 2046, 2047, 2053] 
                   }
               }
           }
        };

        const result = analyzeStrategyStats(spanningStrategy, xmasStats);
        // Expect 2053, NOT 2047
        expect(result?.nextOccurrence).toBe(2053);
    });
});

import { getHolidayStats } from './vacationStrategyUtils';

describe('getHolidayStats', () => {
    it('should identify standard holidays correctly', () => {
        const easter = getHolidayStats('Wielkanoc', 2025);
        expect(easter?.isOptimal).toBe(true);
        expect(easter?.standardDescription).toContain('Zawsze w niedzielę i poniedziałek');

        const corpus = getHolidayStats('Boże Ciało', 2025);
        expect(corpus?.standardDescription).toContain('Co roku wypada w czwartek');

        const pentecost = getHolidayStats('Zielone Świątki', 2025);
        expect(pentecost?.standardDescription).toContain('Co roku wypadają w niedzielę');
    });

    it('should score Majówka correctly', () => {
        // Monday Start (2028: May 1 Mon) -> Optimal (10)
        const may2028 = getHolidayStats('Majówka', 2028);
        expect(may2028?.isOptimal).toBe(true);
        expect(may2028?.layout).toBe('pn-wt-śr'); // May 1 is Mon
        // 2028 is leap. Jan 1 Sat. Feb 29.
        // May 1 2028: new Date(2028, 4, 1).getDay() -> Mon (1).
        // My logic: if dow=1, score 10.
        // And layout[1] = "pn-wt-śr".
        // Wait, layouts array in code:
        // [0]="nd-pn-wt", [1]="pn-wt-śr".
        // Correct.
        // Wait, why did I expect 'nd-pn-wt' for 2028?
        // Ah, if d.getDay() is 1 (Mon), layouts[1] is "pn-wt-śr".
        // Let's assert score.
        // But 2028 May 1 is Monday.
        
        // Friday Start (2026: May 1 Fri) -> Bad (2) (Downgraded logic)
        const may2026 = getHolidayStats('Majówka', 2026);
        expect(may2026?.isOptimal).toBe(false);
        // May 1 2026 is Friday.
        // Logic: Fri (5) => Score 2.
    });

    it('should score Christmas correctly', () => {
        // Tue (2025: Dec 25 Thu) -> Optimal (10)
        const xmas2025 = getHolidayStats('Boże Narodzenie', 2025);
        expect(xmas2025?.isOptimal).toBe(true);

        // Should also handle "Wigilia"
        const wigilia2025 = getHolidayStats('Wigilia Bożego Narodzenia', 2025);
        expect(wigilia2025?.isOptimal).toBe(true);
        expect(wigilia2025?.layout).toBe(xmas2025?.layout); // Should share stats
        
        // Tue (2029: Dec 25 Tue) -> Optimal (10)
        const xmas2029 = getHolidayStats('Boże Narodzenie', 2029);
        expect(xmas2029?.isOptimal).toBe(true);

        // Fri (2026: Dec 25 Fri) -> Sub-optimal (5)
        const xmas2026 = getHolidayStats('Boże Narodzenie', 2026);
        expect(xmas2026?.isOptimal).toBe(false); 
        // Score should be 5, so !isOptimal (which requires 10).
    });

    it('should score New Year correctly (Fixed Holiday Logic)', () => {
        // 2029: Jan 1 is Monday -> Optimal (10)
        const ny2029 = getHolidayStats('Nowy Rok', 2029);
        expect(ny2029?.isOptimal).toBe(true);
        expect(ny2029?.layout).toBe('Poniedziałek');

        // 2028: Jan 1 is Saturday -> Bad (2)
        const ny2028 = getHolidayStats('Nowy Rok', 2028);
        expect(ny2028?.isOptimal).toBe(false);
    });
});
