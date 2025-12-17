import { describe, it, expect } from 'vitest';
import { analyzeStrategyStats, VacationOpportunity } from './vacationStrategyUtils';

describe('Fair Percentile Logic (Reproduction of Majówka Issue)', () => {
    
    // Mock Data based on vacationStats.json for Majówka
    // A simplified distribution:
    // 25 items at 1.8 (Worse)
    // 40 items at 2.0 (Equal - The Target)
    // 35 items at 2.5 (Better)
    // Total: 100 samples
    const mockStatsData = {
        "TestPeriod": {
            samples: 100,
            efficiencies: [
                ...Array(25).fill(1.8), // 25% Worse
                ...Array(40).fill(2.0), // 40% Equal
                ...Array(35).fill(2.5)  // 35% Better
            ],
            maxEfficiency: 3.0,
            combinations: {
                "2.00_10": { count: 33, years: [] }, // Matching key for 2.00 efficiency
                "1.80_10": { count: 1, years: [] },  // For "Worse" test
                "2.50_10": { count: 1, years: [] }   // For "Best" test
            }
        }
    };

    const mockStrategy: VacationOpportunity = {
        id: 'test',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-05-10'),
        daysToTake: 5,
        vacationDays: [],
        freeDays: 10, // 2.0 efficiency
        efficiency: 2.0,
        description: 'Test Strategy',
        periodName: 'TestPeriod',
        monthIndex: 4
    };

    it('should calculate fair percentile around 45% for a median value (2.0)', () => {
        const result = analyzeStrategyStats(mockStrategy, mockStatsData);
        
        expect(result).not.toBeNull();
        if (result) {
            // Old Logic:
            // BetterThan = 25 (only the 1.8s)
            // Percentile = 25/100 = 25%
            
            // New Fair Logic:
            // BetterThan = 25
            // EqualTo = 40
            // Score = 25 + (40 * 0.5) = 25 + 20 = 45
            // Percentile = 45/100 = 45%
            
            console.log(`Calculated Percentile: ${result.percentile}%`);
            
            expect(result.percentile).toBeGreaterThanOrEqual(44);
            expect(result.percentile).toBeLessThanOrEqual(46);
        }
    });

    it('should calculate 0-12% for the absolute worst value (1.8)', () => {
         const worseStrategy = { ...mockStrategy, efficiency: 1.8 };
         const result = analyzeStrategyStats(worseStrategy, mockStatsData);
         
         // BetterThan = 0
         // EqualTo = 25
         // Score = 0 + 12.5 = 12.5
         // Percentile = 12.5 -> ~13%
         
         // Note: pure rank would be 0%. Fair rank puts it in middle of the "bad" pack.
         expect(result?.percentile).toBe(13); 
    });
    
    it('should calculate high percentile for best value (2.5)', () => {
         const bestStrategy = { ...mockStrategy, efficiency: 2.5 };
         const result = analyzeStrategyStats(bestStrategy, mockStatsData);
         
         // BetterThan = 65 (25 + 40)
         // EqualTo = 35
         // Score = 65 + 17.5 = 82.5
         // Percentile = ~83%
         
         expect(result?.percentile).toBe(83);
    });
});
