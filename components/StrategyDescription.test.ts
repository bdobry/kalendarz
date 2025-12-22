import { describe, it, expect } from 'vitest';
import { generateStrategyText } from './StrategyDescription';
import { VacationOpportunity } from '../utils/vacationStrategyUtils';

// Mock strategy factory
const createStrategy = (start: Date, end: Date, cost: number, free: number, efficiency: number): VacationOpportunity => ({
  id: 'test',
  startDate: start,
  endDate: end,
  daysToTake: cost,
  freeDays: free,
  efficiency: efficiency,
  vacationDays: [], 
  monthIndex: start.getMonth(),
  description: 'Test Strategy'
});

describe('generateStrategyText logic', () => {
  it('detects Majówka correctly', () => {
    // 2025: May 1st is Thursday. Strategy: May 1-4
    const start = new Date(2025, 4, 1); // May 1 (Month is 0-indexed)
    const end = new Date(2025, 4, 4);
    const strategy = createStrategy(start, end, 1, 4, 4.0);
    
    const text = generateStrategyText(strategy, 'GOOD');
    expect(text).toContain('Majówka 2025');
  });

  it('detects Christmas correctly', () => {
    const start = new Date(2025, 11, 24); // Dec 24
    const end = new Date(2025, 11, 28);
    const strategy = createStrategy(start, end, 0, 5, 0); // hypothetical
    
    const text = generateStrategyText(strategy);
    expect(text).toContain('Boże Narodzenie 2025');
  });

  it('detects "Hit" rating', () => {
    const start = new Date(2025, 5, 15);
    const end = new Date(2025, 5, 20);
    const strategy = createStrategy(start, end, 1, 9, 9.0);
    
    const text = generateStrategyText(strategy, 'BEST');
    expect(text).toContain('Hit!');
    expect(text).toContain('aż 9 dni wolnego');
  });
});
