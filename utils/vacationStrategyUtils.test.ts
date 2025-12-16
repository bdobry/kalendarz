import { describe, it, expect } from 'vitest';
import { analyzeVacationStrategies } from './vacationStrategyUtils';

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
        s.description.toLowerCase().includes('maj') || s.monthIndex === 4
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
  });
});
