
import { generateCalendarData, getYearStats } from './utils/dateUtils';

const year = 2024;
const data = generateCalendarData(year);
const stats = getYearStats(data, false);

console.log('--- Long Weekends 2024 ---');
console.log(JSON.stringify(stats.longWeekendsList, null, 2));

console.log('--- Potential Weekends 2024 ---');
console.log(JSON.stringify(stats.potentialWeekendsList, null, 2));
