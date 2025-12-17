
import { describe, it, expect } from 'vitest';
import { analyzeStrategyStats, VacationOpportunity } from './vacationStrategyUtils';

describe('Reproduce Rare/Mediocre Issue', () => {
    // Mock stats data representing a scenario with:
    // - High Max Efficiency (4.5)
    // - Many Low Efficiency samples (1.8 - 2.0)
    // - Rare Medium Efficiency samples (3.33)
    const mockStatsData = {
        "Test Period": {
            "samples": 100,
            "maxEfficiency": 4.5,
            "efficiencies": [
                ...Array(80).fill(1.8), // 80% are basic days off
                ...Array(10).fill(2.0), // 10% are slightly better
                ...Array(5).fill(3.33), // 5% are "Medium" (The case in question)
                ...Array(5).fill(4.5),  // 5% are "Best"
            ],
            "combinations": {
                "3.33_10": { count: 4, years: [2028, 2038] }, // Happens rarely
                "4.40_10": { count: 2, years: [2032, 2045] }, // Rare High Quality
                "4.50_16": { count: 30, years: [2029, 2030] }, // Happens often (hypothetically, to make rare relative)
                "4.50_HighFreq": { count: 38, years: [2022, 2024, 2026] } // Approx every 2 years (76/38 = 2)
            }
        }
    };

    it('should NOT label a 3.33 efficiency strategy as Rare when max efficiency is 4.5, even if it has high percentile', () => {
        const mediocreStrategy: VacationOpportunity = {
            id: 'test',
            startDate: new Date('2028-12-23'),
            endDate: new Date('2029-01-01'),
            daysToTake: 3,
            vacationDays: [],
            freeDays: 10,
            efficiency: 3.33,
            description: 'Test',
            periodName: 'Test Period',
            monthIndex: 11
        };

        const result = analyzeStrategyStats(mediocreStrategy, mockStatsData);

        // Debugging info
        const betterThan = mockStatsData["Test Period"].efficiencies.filter(e => e < 3.33).length;
        console.log('Better Than Count:', betterThan); // Should be 90 (80+10)
        console.log('Percentile:', (betterThan / 100) * 100); // 90%
        
        // Detailed Logic Check
        // Current Logic: percentile > 80 && !isStandardSequence
        // 90 > 80 is TRUE. 
        // We expect it to be labeled "Rare" in the OLD logic.
        // We want it to be FALSE in the NEW logic because 3.33 < (0.85 * 4.5 = 3.825)

        expect(result).not.toBeNull();
        if (result) {
            expect(result.isRare).toBe(false); 
        }
    });

    it('should label a 4.4 efficiency strategy as Rare if it meets criteria', () => {
         const goodStrategy: VacationOpportunity = {
            id: 'test2',
            startDate: new Date('2032-12-23'),
            endDate: new Date('2032-01-01'),
            daysToTake: 3,
            vacationDays: [],
            freeDays: 10,
            efficiency: 4.4, // Close to 4.5
            description: 'Test',
            periodName: 'Test Period',
            monthIndex: 11
        };

        const result = analyzeStrategyStats(goodStrategy, mockStatsData);
        // 4.4 is > 3.825. 
        // Percentile: 95 better than.
        // Should be Rare.
        
        expect(result?.isRare).toBe(true);
    });

    it('should NOT label a 4.5 efficiency strategy as Rare if it happens frequently (every 2 years)', () => {
        const frequentStrategy: VacationOpportunity = {
           id: 'test3',
           startDate: new Date('2022-12-23'),
           endDate: new Date('2022-01-01'),
           daysToTake: 3,
           vacationDays: [],
           freeDays: 16, // Best possible
           efficiency: 4.5, // Best possible
           description: 'Test High Freq',
           periodName: 'Test Period',
           monthIndex: 0
       };

       // We need to modify the combination lookup logic in the mock or ensure analyzeStrategyStats finds it.
       // analyzeStrategyStats uses efficiency and freeDays to find key.
       // 4.5 and 16 days -> Look for key "4.50_16" ?? Wait.
       // In my mock above I added "4.50_HighFreq". I need to make sure the key matches logic.
       // logic: const comboKey = `${strategy.efficiency.toFixed(2)}_${strategy.freeDays}`;
       // So for 4.5 efficiency and 16 free days, key is "4.50_16".
       // In my previous step I added "4.50_HighFreq" which is wrong format.
       // I should fix the mock key first or use compatible values.
       // Let's use efficiency 4.50 and freeDays 99 to match a specific mock key if I change it.
       // Or better, let's fix the mock in the previous step (in my mind) or just Append a correct key now.
       // I will use a new key "4.50_99" for this test case in the mock.
       
       // actually I can't easily edit the mock structure defined inside the test file in previous block without replacing it.
       // I will use the "4.50_HighFreq" key idea but I need to ensure the strategy matches it.
       // But wait, the function derives key from strategy values.
       // So I must provide strategy values that produce "4.50_HighFreq" ?? No.
       // The code does: const combinations = stats.combinations?.[comboKey];
       // So comboKey MUST be "4.50_16".
       // My mock has "4.50_16" with count=30 (freq ~2.5 years).
       // 76 / 30 = 2.53 years. 
       // This is < 4. So it should NOT be rare.
       // So I can just use the existing "4.50_16" mock entry!
       
       const result = analyzeStrategyStats(frequentStrategy, mockStatsData);
       // freq = 76 / 30 = 2.5. 
       // isTrulyRareFreq = 2.5 >= 4 => FALSE.
       // Expect isRare = false.
       
       expect(result?.isRare).toBe(false);
   });
});
