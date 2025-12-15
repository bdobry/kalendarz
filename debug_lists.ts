
import { generateCalendarData, getYearStats } from './utils/dateUtils';

const year = 2025;
const data = generateCalendarData(year);
const stats = getYearStats(data, false); // No redeem saturdays

console.log('--- Long Weekends ---');
console.log(JSON.stringify(stats.longWeekendsList, null, 2));

console.log('--- Potential Weekends ---');
console.log(JSON.stringify(stats.potentialWeekendsList, null, 2));
