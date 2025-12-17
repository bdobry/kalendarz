
import fs from 'fs';
import path from 'path';
import { analyzeVacationStrategies, VacationOpportunity } from '../utils/vacationStrategyUtils';

const START_YEAR = 2024;
const END_YEAR = 2100;
const OUTPUT_FILE = path.join(process.cwd(), 'data/vacationStats.json');

interface CombinationStats {
    count: number;
    years: number[];
}

interface PeriodStats {
    samples: number; 
    efficiencies: number[];
    maxFreeDays: number[];
    minCost: number[];
    combinations: Record<string, CombinationStats>; // Key: "eff_len" -> { count, years }
    maxEfficiency: number;
    maxPossibleLength: number;
    avgEfficiency: number;
    avgLength: number;
}

const stats: Record<string, PeriodStats> = {};

console.log(`Generating stats from ${START_YEAR} to ${END_YEAR}...`);

for (let year = START_YEAR; year <= END_YEAR; year++) {
    const opportunities = analyzeVacationStrategies(year);
    
    opportunities.forEach(opp => {
        const period = opp.periodName || 'Inne';
        
        if (!stats[period]) {
            stats[period] = {
                samples: 0,
                efficiencies: [],
                maxFreeDays: [],
                minCost: [],
                combinations: {},
                maxEfficiency: 0,
                maxPossibleLength: 0,
                avgEfficiency: 0,
                avgLength: 0
            };
        }
        
        const s = stats[period];
        s.samples++;
        s.efficiencies.push(opp.efficiency);
        s.maxFreeDays.push(opp.freeDays);
        s.minCost.push(opp.daysToTake);
        
        if (opp.efficiency > s.maxEfficiency) s.maxEfficiency = opp.efficiency;
        if (opp.freeDays > s.maxPossibleLength) s.maxPossibleLength = opp.freeDays;

        // Combination Key: Efficiency (2 decimal) + Length
        // We group by "What user gets" basically.
        const key = `${opp.efficiency.toFixed(2)}_${opp.freeDays}`;
        
        if (!s.combinations[key]) {
             s.combinations[key] = { count: 0, years: [] };
        }
        s.combinations[key].count++;
        s.combinations[key].years.push(year);
    });
}

// Post-process
Object.keys(stats).forEach(key => {
    const s = stats[key];
    const sumEff = s.efficiencies.reduce((a, b) => a + b, 0);
    const sumLen = s.maxFreeDays.reduce((a, b) => a + b, 0);
    
    s.avgEfficiency = parseFloat((sumEff / s.samples).toFixed(2));
    s.avgLength = parseFloat((sumLen / s.samples).toFixed(1));
    
    s.efficiencies.sort((a, b) => a - b);
});

// Ensure output dir exists
const dir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(stats, null, 2));
console.log(`Stats saved to ${OUTPUT_FILE}`);
