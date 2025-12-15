// Main application script

/**
 * Load holiday data from JSON file
 * @returns {Promise<Object>} Holiday data object
 */
async function loadHolidayData() {
  try {
    const response = await fetch('data/holidays-pl-2015-2044.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading holiday data:', error);
    throw error;
  }
}

/**
 * Validate holiday data format and consistency
 * @param {Object} data - Holiday data object
 * @returns {boolean} True if valid, throws error otherwise
 */
function validateHolidayData(data) {
  const errors = [];
  
  // Check if meta exists
  if (!data.meta) {
    errors.push('Missing meta section');
  }
  
  // Check if years exists
  if (!data.years) {
    errors.push('Missing years section');
  } else {
    // Get expected year range from meta
    const [startYear, endYear] = data.meta?.years || [2025, 2034];
    
    // Check if all years have corresponding keys
    for (let year = startYear; year <= endYear; year++) {
      const yearKey = year.toString();
      if (!data.years[yearKey]) {
        errors.push(`Missing year key: ${yearKey}`);
      } else {
        const holidays = data.years[yearKey];
        const seenDates = new Set();
        
        // Validate each holiday in the year
        holidays.forEach((holiday, index) => {
          // Check date format (YYYY-MM-DD)
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!holiday.date || !dateRegex.test(holiday.date)) {
            errors.push(`Invalid date format at year ${year}, index ${index}: ${holiday.date}`);
          }
          
          // Check if date belongs to the correct year
          if (holiday.date && !holiday.date.startsWith(yearKey + '-')) {
            errors.push(`Date ${holiday.date} does not belong to year ${year}`);
          }
          
          // Check for duplicate dates
          if (seenDates.has(holiday.date)) {
            errors.push(`Duplicate date in year ${year}: ${holiday.date}`);
          }
          seenDates.add(holiday.date);
        });
      }
    }
  }
  
  // If there are errors, log them and throw
  if (errors.length > 0) {
    errors.forEach(error => console.error('Validation error:', error));
    throw new Error(`Holiday data validation failed with ${errors.length} error(s)`);
  }
  
  return true;
}

/**
 * Get current year from URL parameter or default to current calendar year
 * @param {Object} holidayData - Holiday data object
 * @returns {number} Selected year
 */
function getCurrentYear(holidayData) {
  const urlParams = new URLSearchParams(window.location.search);
  const rokParam = urlParams.get('rok');
  
  if (rokParam) {
    const year = parseInt(rokParam, 10);
    // Validate if year exists in holiday data
    if (holidayData.years[year.toString()]) {
      return year;
    }
  }
  
  // Fallback to current calendar year if available, otherwise first year in JSON
  const currentCalendarYear = new Date().getFullYear();
  if (holidayData.years[currentCalendarYear.toString()]) {
    return currentCalendarYear;
  }
  
  return holidayData.meta.years[0];
}

/**
 * Update URL with current year parameter
 * @param {number} year - Year to set in URL
 */
function updateURLParameter(year) {
  const url = new URL(window.location);
  url.searchParams.set('rok', year);
  window.history.pushState({}, '', url);
}

/**
 * Populate year select dropdown with years from JSON
 * @param {Object} holidayData - Holiday data object
 */
function populateYearSelect(holidayData) {
  const yearSelect = document.getElementById('yearSelect');
  
  // Validate meta.years exists and has correct format
  if (!holidayData.meta?.years || holidayData.meta.years.length !== 2) {
    console.error('Invalid holiday data meta.years format');
    return;
  }
  
  const [startYear, endYear] = holidayData.meta.years;
  
  // Clear existing options
  yearSelect.innerHTML = '';
  
  // Add options for each year
  for (let year = startYear; year <= endYear; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

/**
 * Get Polish day of week name (short form)
 * @param {Date} date - Date object
 * @returns {string} Day name (Pon, Wt, Śr, Czw, Pt, Sob, Nd)
 */
function getPolishDayName(date) {
  const days = ['Nd', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
  return days[date.getDay()];
}

/**
 * Get Polish month name
 * @param {number} month - Month number (0-11)
 * @returns {string} Month name in Polish
 */
function getPolishMonthName(month) {
  const months = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
  ];
  // Bounds checking
  if (month < 0 || month > 11) {
    console.error(`Invalid month: ${month}. Expected 0-11.`);
    return 'Nieznany';
  }
  return months[month];
}

/**
 * Format a Date object to YYYY-MM-DD string
 * @param {Date} date - Date object to format
 * @returns {string} Date string in YYYY-MM-DD format
 */
function formatDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Calculate natural long weekends (3+ consecutive days off)
 * @param {Set} holidaysSet - Set of holiday date strings (YYYY-MM-DD)
 * @param {number} year - Year to calculate for
 * @returns {number} Number of natural long weekends
 */
function calculateNaturalLongWeekends(holidaysSet, year) {
  // Create an array of all days in the year with their off/work status
  const firstDay = new Date(year, 0, 1);
  const lastDay = new Date(year, 11, 31);
  const daysInYear = Math.ceil((lastDay - firstDay) / (1000 * 60 * 60 * 24)) + 1;
  
  const offDays = [];
  for (let i = 0; i < daysInYear; i++) {
    const date = new Date(year, 0, 1 + i);
    const dateString = formatDateString(date);
    const dayOfWeek = date.getDay();
    
    // A day is off if it's a weekend (Sat=6, Sun=0) or a holiday
    const isOff = dayOfWeek === 0 || dayOfWeek === 6 || holidaysSet.has(dateString);
    offDays.push(isOff);
  }
  
  // Count sequences of 3+ consecutive off days
  let longWeekendCount = 0;
  let consecutiveOffDays = 0;
  let inLongWeekend = false;
  
  for (let i = 0; i < offDays.length; i++) {
    if (offDays[i]) {
      consecutiveOffDays++;
      if (consecutiveOffDays >= 3 && !inLongWeekend) {
        longWeekendCount++;
        inLongWeekend = true;
      }
    } else {
      consecutiveOffDays = 0;
      inLongWeekend = false;
    }
  }
  
  return longWeekendCount;
}

/**
 * Calculate bridge days from a set of holidays
 * Bridge days are working days adjacent to holidays that create long weekend opportunities
 * @param {Set} holidaysSet - Set of holiday date strings (YYYY-MM-DD)
 * @returns {Set} Set of bridge day date strings (YYYY-MM-DD)
 */
function calculateBridgeDays(holidaysSet) {
  const bridgeDays = new Set();
  
  holidaysSet.forEach(dateString => {
    const [yearPart, monthPart, dayPart] = dateString.split('-').map(Number);
    const date = new Date(yearPart, monthPart - 1, dayPart);
    const dayOfWeek = date.getDay();
    
    // If holiday is on Tuesday (2), Monday is the bridge day
    if (dayOfWeek === 2) {
      const bridgeDate = new Date(date);
      bridgeDate.setDate(bridgeDate.getDate() - 1);
      const bridgeString = formatDateString(bridgeDate);
      // Only add if it's a weekday (not Saturday, Sunday, or another holiday)
      if (bridgeDate.getDay() !== 0 && bridgeDate.getDay() !== 6 && !holidaysSet.has(bridgeString)) {
        bridgeDays.add(bridgeString);
      }
    }
    // If holiday is on Thursday (4), Friday is the bridge day
    else if (dayOfWeek === 4) {
      const bridgeDate = new Date(date);
      bridgeDate.setDate(bridgeDate.getDate() + 1);
      const bridgeString = formatDateString(bridgeDate);
      // Only add if it's a weekday (not Saturday, Sunday, or another holiday)
      if (bridgeDate.getDay() !== 0 && bridgeDate.getDay() !== 6 && !holidaysSet.has(bridgeString)) {
        bridgeDays.add(bridgeString);
      }
    }
  });
  
  return bridgeDays;
}

/**
 * Render calendar for the entire year
 * @param {number} year - Year to render
 * @param {Set} holidaysSet - Set of holiday date strings (YYYY-MM-DD)
 */
function renderCalendar(year, holidaysSet) {
  const calendarContainer = document.getElementById('calendar');
  
  // Clear existing content
  calendarContainer.innerHTML = '';
  
  // Calculate bridge days
  const bridgeDays = calculateBridgeDays(holidaysSet);
  
  // Render 12 months
  for (let month = 0; month < 12; month++) {
    const monthCard = document.createElement('div');
    monthCard.className = 'month-card';
    
    // Month header
    const monthHeader = document.createElement('div');
    monthHeader.className = 'month-header';
    monthHeader.textContent = getPolishMonthName(month);
    monthCard.appendChild(monthHeader);
    
    // Month grid
    const monthGrid = document.createElement('div');
    monthGrid.className = 'month-grid';
    
    // Add day name headers (Pon-Nd)
    const dayNames = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'];
    dayNames.forEach(dayName => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';
      dayHeader.textContent = dayName;
      monthGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Calculate offset (Monday = 0, Sunday = 6)
    // Convert from JavaScript's Sunday=0 to Monday=0 system
    const firstDayOfWeek = (firstDay.getDay() + 6) % 7;
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyCell = document.createElement('div');
      emptyCell.className = 'day-cell empty';
      monthGrid.appendChild(emptyCell);
    }
    
    // Add day cells
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateString = formatDateString(date);
      const dayOfWeek = date.getDay();
      
      const dayButton = document.createElement('button');
      dayButton.className = 'day';
      dayButton.textContent = day;
      dayButton.setAttribute('data-date', dateString);
      
      // Mark weekends
      if (dayOfWeek === 0) {
        dayButton.classList.add('sunday');
      } else if (dayOfWeek === 6) {
        dayButton.classList.add('saturday');
      }
      
      // Mark holidays
      if (holidaysSet.has(dateString)) {
        dayButton.classList.add('holiday');
      }
      
      // Mark bridge days (days worth taking off to create longer weekends)
      if (bridgeDays.has(dateString)) {
        dayButton.classList.add('bridge');
      }
      
      monthGrid.appendChild(dayButton);
    }
    
    monthCard.appendChild(monthGrid);
    calendarContainer.appendChild(monthCard);
  }
}

/**
 * Compute statistics for a given year and satMode
 * @param {number} year - Selected year
 * @param {string} satMode - Saturday mode (COMPENSATED or NOT_COMPENSATED)
 * @param {Array} holidays - Array of holiday objects for the year
 * @returns {Object} Statistics object
 */
function computeYearStats(year, satMode, holidays) {
  const stats = {
    totalHolidays: holidays.length,
    weekday: 0,
    saturday: 0,
    sunday: 0,
    naturalLongWeekends: 0,
    potentialLongWeekends: 0,
    effectiveDaysOff: 0,
    lost: 0
  };
  
  // Create a set of holiday dates for quick lookup
  const holidayDates = new Set(holidays.map(h => h.date));
  
  holidays.forEach(holiday => {
    const [yearPart, monthPart, dayPart] = holiday.date.split('-').map(Number);
    const date = new Date(yearPart, monthPart - 1, dayPart);
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    if (dayOfWeek === 0) {
      // Sunday
      stats.sunday++;
    } else if (dayOfWeek === 6) {
      // Saturday
      stats.saturday++;
    } else {
      // Monday-Friday
      stats.weekday++;
    }
  });
  
  // Calculate natural long weekends (3+ consecutive days off)
  stats.naturalLongWeekends = calculateNaturalLongWeekends(holidayDates, year);
  
  // Calculate bridge days (potential long weekends with vacation days)
  const bridgeDays = calculateBridgeDays(holidayDates);
  stats.potentialLongWeekends = bridgeDays.size;
  
  // Calculate effective days off
  if (satMode === window.SAT_MODE.COMPENSATED) {
    // Saturday is working day that needs to be compensated
    stats.effectiveDaysOff = stats.weekday + stats.saturday;
    stats.lost = stats.sunday;
  } else {
    // Saturday is free day
    stats.effectiveDaysOff = stats.weekday;
    stats.lost = stats.saturday + stats.sunday;
  }
  
  return stats;
}

/**
 * Compute score for a year based on statistics
 * @param {Object} stats - Statistics object from computeYearStats
 * @param {string} satMode - Saturday mode (COMPENSATED or NOT_COMPENSATED)
 * @returns {number} Computed score
 */
function computeScore(stats, satMode) {
  let score = stats.weekday + stats.bridges;
  if (satMode === window.SAT_MODE.COMPENSATED) {
    score += stats.saturday;
  }
  return score;
}

/**
 * Compute min and max scores across all years for a given satMode
 * @param {string} satMode - Saturday mode (COMPENSATED or NOT_COMPENSATED)
 * @returns {Object} Object with minScore and maxScore
 */
function computeMinMaxScores(satMode) {
  const yearKeys = Object.keys(window.holidayData.years);
  let minScore = Infinity;
  let maxScore = -Infinity;
  
  yearKeys.forEach(yearKey => {
    const year = parseInt(yearKey, 10);
    const holidays = window.holidayData.years[yearKey];
    const stats = computeYearStats(year, satMode, holidays);
    const score = computeScore(stats, satMode);
    
    minScore = Math.min(minScore, score);
    maxScore = Math.max(maxScore, score);
  });
  
  return { minScore, maxScore };
}

/**
 * Map score to grade letter A-I (A is best, I is worst)
 * @param {number} score - Score to map
 * @param {number} minScore - Minimum score across all years
 * @param {number} maxScore - Maximum score across all years
 * @returns {string} Grade letter (A-I)
 */
function mapScoreToGrade(score, minScore, maxScore) {
  // Edge case: if all scores are the same
  if (minScore === maxScore) {
    return 'E'; // Middle grade
  }
  
  // Map score to 9 grades (A-I)
  // Higher score = better grade
  // A is best (highest scores), I is worst (lowest scores)
  const grades = ['I', 'H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];
  const range = maxScore - minScore;
  const normalizedScore = (score - minScore) / range; // 0.0 to 1.0
  const gradeIndex = Math.min(grades.length - 1, Math.floor(normalizedScore * grades.length));
  
  return grades[gradeIndex];
}

/**
 * Compute grade for current year and satMode
 * @param {number} year - Selected year
 * @param {string} satMode - Saturday mode (COMPENSATED or NOT_COMPENSATED)
 * @param {Object} stats - Statistics object from computeYearStats
 * @returns {Object} Object with grade, score, minScore, maxScore
 */
function computeGrade(year, satMode, stats) {
  const score = computeScore(stats, satMode);
  const { minScore, maxScore } = computeMinMaxScores(satMode);
  const grade = mapScoreToGrade(score, minScore, maxScore);
  
  return { grade, score, minScore, maxScore };
}

/**
 * Get years by grade for tooltip
 * @param {string} satMode - Saturday mode
 * @returns {Object} Object mapping grades to arrays of years
 */
function getYearsByGrade(satMode) {
  const yearsByGrade = {};
  const yearKeys = Object.keys(window.holidayData.years);
  
  yearKeys.forEach(yearKey => {
    const year = parseInt(yearKey, 10);
    const holidays = window.holidayData.years[yearKey];
    const stats = computeYearStats(year, satMode, holidays);
    const gradeInfo = computeGrade(year, satMode, stats);
    
    if (!yearsByGrade[gradeInfo.grade]) {
      yearsByGrade[gradeInfo.grade] = [];
    }
    yearsByGrade[gradeInfo.grade].push(year);
  });
  
  // Sort years in each grade
  Object.keys(yearsByGrade).forEach(grade => {
    yearsByGrade[grade].sort((a, b) => a - b);
  });
  
  return yearsByGrade;
}

/**
 * Render grade letter and scale to the UI
 * @param {Object} gradeInfo - Object with grade, score, minScore, maxScore
 * @param {number} year - Current year
 */
function renderGrade(gradeInfo, year) {
  const { grade, score, minScore, maxScore } = gradeInfo;
  
  // Update grade title with current year
  const gradeTitle = document.querySelector('.grade-title');
  if (gradeTitle) {
    gradeTitle.textContent = `Klasa efektywności świątecznej – ${year}`;
  }
  
  // Get years by grade for tooltips
  const satMode = getCurrentSatMode();
  const yearsByGrade = getYearsByGrade(satMode);
  
  // Render grade scale
  const gradeScale = document.getElementById('gradeScale');
  gradeScale.innerHTML = '';
  
  const grades = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  grades.forEach(gradeLevel => {
    const gradeBar = document.createElement('div');
    gradeBar.className = 'grade-bar';
    
    if (gradeLevel === grade) {
      gradeBar.classList.add('active');
    }
    
    // Set the grade letter text
    const letterText = document.createTextNode(gradeLevel);
    gradeBar.appendChild(letterText);
    
    // Add grade indicator for active grade (triangle + black square with letter)
    if (gradeLevel === grade) {
      const indicator = document.createElement('div');
      indicator.className = 'grade-indicator';
      indicator.setAttribute('data-grade', gradeLevel);
      gradeBar.appendChild(indicator);
    }
    
    // Add tooltip with years for this grade
    const tooltip = document.createElement('div');
    tooltip.className = 'grade-bar-tooltip';
    const yearsInGrade = yearsByGrade[gradeLevel] || [];
    if (yearsInGrade.length > 0) {
      tooltip.textContent = yearsInGrade.join(', ');
    } else {
      tooltip.textContent = 'Brak lat';
    }
    gradeBar.appendChild(tooltip);
    
    gradeScale.appendChild(gradeBar);
  });
}

/**
 * Render statistics to the UI (mini-dashboard style)
 * @param {Object} stats - Statistics object from computeYearStats
 */
function renderStats(stats) {
  // Update stat cards with just the values
  const statTotalHolidays = document.getElementById('statTotalHolidays');
  if (statTotalHolidays) {
    const valueEl = statTotalHolidays.querySelector('.stat-value');
    if (valueEl) valueEl.textContent = stats.totalHolidays;
  }
  
  const statWeekday = document.getElementById('statWeekday');
  if (statWeekday) {
    const valueEl = statWeekday.querySelector('.stat-value');
    if (valueEl) valueEl.textContent = stats.weekday;
  }
  
  const statSaturday = document.getElementById('statSaturday');
  if (statSaturday) {
    const valueEl = statSaturday.querySelector('.stat-value');
    if (valueEl) valueEl.textContent = stats.saturday;
  }
  
  const statSunday = document.getElementById('statSunday');
  if (statSunday) {
    const valueEl = statSunday.querySelector('.stat-value');
    if (valueEl) valueEl.textContent = stats.sunday;
  }
  
  const statNaturalLongWeekends = document.getElementById('statNaturalLongWeekends');
  if (statNaturalLongWeekends) {
    const valueEl = statNaturalLongWeekends.querySelector('.stat-value');
    if (valueEl) valueEl.textContent = stats.naturalLongWeekends;
  }
  
  const statPotentialLongWeekends = document.getElementById('statPotentialLongWeekends');
  if (statPotentialLongWeekends) {
    const valueEl = statPotentialLongWeekends.querySelector('.stat-value');
    if (valueEl) valueEl.textContent = stats.potentialLongWeekends;
  }
  
  const statEffectiveDaysOff = document.getElementById('statEffectiveDaysOff');
  if (statEffectiveDaysOff) {
    const valueEl = statEffectiveDaysOff.querySelector('.stat-value');
    if (valueEl) valueEl.textContent = stats.effectiveDaysOff;
  }
  
  const statLost = document.getElementById('statLost');
  if (statLost) {
    const valueEl = statLost.querySelector('.stat-value');
    if (valueEl) valueEl.textContent = stats.lost;
  }
}

/**
 * Render bridge days list for selected year
 * @param {number} year - Selected year
 * @param {Set} holidaysSet - Set of holiday date strings (YYYY-MM-DD)
 */
function renderBridgeList(year, holidaysSet) {
  const bridgeList = document.getElementById('bridgeList');
  const bridgeDays = calculateBridgeDays(holidaysSet);
  
  // Clear existing content
  bridgeList.innerHTML = '';
  
  // Add heading
  const heading = document.createElement('h3');
  heading.textContent = 'Dni na urlop – długie weekendy';
  bridgeList.appendChild(heading);
  
  if (bridgeDays.size === 0) {
    const noDataMsg = document.createElement('p');
    noDataMsg.textContent = 'Brak okazji do długich weekendów w tym roku.';
    noDataMsg.style.fontSize = '14px';
    noDataMsg.style.color = '#666';
    bridgeList.appendChild(noDataMsg);
    return;
  }
  
  // Convert to array and sort by date
  const bridgeArray = Array.from(bridgeDays).sort();
  
  bridgeArray.forEach(dateString => {
    const [yearPart, monthPart, dayPart] = dateString.split('-').map(Number);
    const date = new Date(yearPart, monthPart - 1, dayPart);
    
    const dayName = getPolishDayName(date);
    const dateFormatted = date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    const itemDiv = document.createElement('div');
    itemDiv.className = 'bridge-item';
    
    const dateDiv = document.createElement('div');
    const dateStrong = document.createElement('strong');
    dateStrong.textContent = dateFormatted;
    dateDiv.appendChild(dateStrong);
    dateDiv.appendChild(document.createTextNode(` (${dayName})`));
    
    itemDiv.appendChild(dateDiv);
    bridgeList.appendChild(itemDiv);
  });
}

/**
 * Render holiday list for selected year
 * @param {number} year - Selected year
 * @param {string} satMode - Saturday mode (COMPENSATED or NOT_COMPENSATED)
 */
function renderHolidayList(year, satMode) {
  const holidayList = document.getElementById('holidayList');
  const holidays = window.holidayData.years[year.toString()];
  
  // Clear existing content
  holidayList.innerHTML = '';
  
  // Add heading
  const heading = document.createElement('h3');
  heading.textContent = 'Święta';
  holidayList.appendChild(heading);
  
  if (!holidays || holidays.length === 0) {
    const noDataMsg = document.createElement('p');
    noDataMsg.textContent = 'Brak danych dla tego roku.';
    holidayList.appendChild(noDataMsg);
    return;
  }
  
  holidays.forEach(holiday => {
    // Validate date format (YYYY-MM-DD)
    if (!holiday.date || !/^\d{4}-\d{2}-\d{2}$/.test(holiday.date)) {
      console.error('Invalid date format:', holiday.date);
      return;
    }
    
    // Parse date safely - YYYY-MM-DD format
    const [yearPart, monthPart, dayPart] = holiday.date.split('-').map(Number);
    
    // Validate parsed values
    if (isNaN(yearPart) || isNaN(monthPart) || isNaN(dayPart)) {
      console.error('Invalid date values after parsing:', holiday.date);
      return;
    }
    
    const date = new Date(yearPart, monthPart - 1, dayPart);
    
    // Validate date object
    if (isNaN(date.getTime())) {
      console.error('Invalid Date object created from:', holiday.date);
      return;
    }
    
    const dayName = getPolishDayName(date);
    const dayOfWeek = date.getDay();
    const dateFormatted = date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Create DOM elements to prevent XSS
    const itemDiv = document.createElement('div');
    itemDiv.className = 'holiday-item';
    
    const dateDiv = document.createElement('div');
    const dateStrong = document.createElement('strong');
    dateStrong.textContent = dateFormatted;
    dateDiv.appendChild(dateStrong);
    dateDiv.appendChild(document.createTextNode(` (${dayName})`));
    
    // Add status chip
    const chip = document.createElement('span');
    chip.className = 'holiday-chip';
    
    if (dayOfWeek === 0) {
      // Sunday
      chip.classList.add('sunday');
      chip.textContent = 'Niedziela';
    } else if (dayOfWeek === 6) {
      // Saturday
      if (satMode === window.SAT_MODE.COMPENSATED) {
        chip.classList.add('saturday-compensated');
        chip.textContent = 'Sobota - do odebrania';
      } else {
        chip.classList.add('saturday-free');
        chip.textContent = 'Sobota - wolne';
      }
    } else {
      // Monday-Friday
      chip.classList.add('weekday');
      chip.textContent = 'Pon-Pt';
    }
    
    dateDiv.appendChild(chip);
    
    const nameDiv = document.createElement('div');
    nameDiv.textContent = holiday.name;
    
    itemDiv.appendChild(dateDiv);
    itemDiv.appendChild(nameDiv);
    holidayList.appendChild(itemDiv);
  });
}

/**
 * Get current satMode from toggle switch
 * @returns {string} Current satMode (COMPENSATED or NOT_COMPENSATED)
 */
function getCurrentSatMode() {
  const toggle = document.getElementById('satModeToggle');
  if (toggle) {
    // Toggle ON = COMPENSATED (Soboty do odebrania)
    // Toggle OFF = NOT_COMPENSATED (Soboty wolne)
    return toggle.checked ? window.SAT_MODE.COMPENSATED : window.SAT_MODE.NOT_COMPENSATED;
  }
  return window.APP_CONFIG.defaultSaturdayMode;
}

/**
 * Update page title with current year
 * @param {number} year - Year to display in title
 */
function updatePageTitle(year) {
  const pageTitle = document.getElementById('pageTitle');
  if (pageTitle) {
    pageTitle.textContent = `Wolne w ${year} roku`;
  }
}

/**
 * Update year and stats display
 * @param {number} year - Year to display
 * @param {string} satMode - Saturday mode
 */
function updateYearDisplay(year, satMode) {
  const holidays = window.holidayData.years[year.toString()];
  if (holidays) {
    const stats = computeYearStats(year, satMode, holidays);
    renderStats(stats);
    
    // Render calendar with holidays
    const holidaysSet = new Set(holidays.map(h => h.date));
    renderCalendar(year, holidaysSet);
    
    // Render bridge list
    renderBridgeList(year, holidaysSet);
    
    // Render holiday list
    renderHolidayList(year, satMode);
    
    // Compute and render grade
    const gradeInfo = computeGrade(year, satMode, stats);
    renderGrade(gradeInfo, year);
    
    // Update page title
    updatePageTitle(year);
  }
}

/**
 * Set current year and update UI
 * @param {number} year - Year to set
 */
function setCurrentYear(year) {
  const yearSelect = document.getElementById('yearSelect');
  const oldYear = parseInt(yearSelect.value, 10);
  yearSelect.value = year;
  updateURLParameter(year);
  const satMode = getCurrentSatMode();
  updateYearDisplay(year, satMode);
  
  // Save state after year change
  saveState();
  
  // Track event if year actually changed
  if (oldYear !== year && !isNaN(oldYear)) {
    track('year_change', { from: oldYear, to: year });
  }
}

/**
 * Initialize year navigation handlers
 */
function initYearNavigation() {
  const yearSelect = document.getElementById('yearSelect');
  const yearPrev = document.getElementById('yearPrev');
  const yearNext = document.getElementById('yearNext');
  
  // Validate meta.years exists and has correct format
  if (!window.holidayData.meta?.years || window.holidayData.meta.years.length !== 2) {
    console.error('Invalid holiday data meta.years format');
    return;
  }
  
  const [startYear, endYear] = window.holidayData.meta.years;
  
  // Handle year select change
  yearSelect.addEventListener('change', function() {
    const selectedYear = parseInt(this.value, 10);
    setCurrentYear(selectedYear);
  });
  
  // Handle previous year button
  yearPrev.addEventListener('click', function() {
    const currentYear = parseInt(yearSelect.value, 10);
    if (currentYear > startYear) {
      setCurrentYear(currentYear - 1);
    }
  });
  
  // Handle next year button
  yearNext.addEventListener('click', function() {
    const currentYear = parseInt(yearSelect.value, 10);
    if (currentYear < endYear) {
      setCurrentYear(currentYear + 1);
    }
  });
}

/**
 * Initialize satMode toggle switch handlers
 */
function initSatModeHandlers() {
  const toggle = document.getElementById('satModeToggle');
  
  if (!toggle) {
    console.warn('Saturday mode toggle not found');
    return;
  }
  
  // Set initial value: ON by default (COMPENSATED)
  toggle.checked = true;
  
  // Handle toggle change
  toggle.addEventListener('change', function() {
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = parseInt(yearSelect.value, 10);
    const satMode = getCurrentSatMode();
    updateYearDisplay(currentYear, satMode);
    
    // Save state after satMode change
    saveState();
    
    // Track event
    track('sat_mode_change', { mode: satMode });
  });
}

/**
 * Load state from localStorage
 * @returns {Object|null} Loaded state or null if not found
 */
function loadState() {
  try {
    const stateJson = localStorage.getItem('kalendarz-pl:v1');
    if (stateJson) {
      const state = JSON.parse(stateJson);
      console.log('State loaded from localStorage:', state);
      return state;
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
  }
  return null;
}

/**
 * Save current state to localStorage
 */
function saveState() {
  try {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) {
      console.warn('Cannot save state: yearSelect element not found');
      return;
    }
    
    const currentYear = parseInt(yearSelect.value, 10);
    const satMode = getCurrentSatMode();
    
    const state = {
      year: currentYear,
      satMode: satMode
    };
    
    localStorage.setItem('kalendarz-pl:v1', JSON.stringify(state));
    console.log('State saved to localStorage:', state);
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
}



/**
 * Get consent decision from localStorage
 * @returns {string|null} 'granted', 'denied', or null if not set
 */
function getConsent() {
  try {
    return localStorage.getItem('consent:v1');
  } catch (error) {
    console.error('Error reading consent from localStorage:', error);
    return null;
  }
}

/**
 * Set consent decision in localStorage
 * @param {string} decision - 'granted' or 'denied'
 */
function setConsent(decision) {
  try {
    localStorage.setItem('consent:v1', decision);
    console.log('Consent set to:', decision);
  } catch (error) {
    console.error('Error saving consent to localStorage:', error);
  }
}

/**
 * Show or hide consent banner based on config and consent status
 */
function updateConsentBanner() {
  const banner = document.getElementById('consentBanner');
  if (!banner) {
    return;
  }
  
  const consent = getConsent();
  const requireConsent = window.APP_CONFIG.consentRequired;
  
  // Show banner if consent is required and no decision has been made
  if (requireConsent && consent === null) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }
}

/**
 * Load Plausible analytics script
 */
function loadPlausible() {
  const config = window.APP_CONFIG.analytics.plausible;
  if (!config.domain || !config.src) {
    console.warn('Plausible config incomplete, skipping load');
    return;
  }
  
  // Check if already loaded
  if (document.querySelector(`script[src="${config.src}"]`)) {
    console.log('Plausible already loaded');
    return;
  }
  
  const script = document.createElement('script');
  script.defer = true;
  script.setAttribute('data-domain', config.domain);
  script.src = config.src;
  document.head.appendChild(script);
  console.log('Plausible script loaded');
}

/**
 * Load Google Analytics 4 script
 */
function loadGA4() {
  const config = window.APP_CONFIG.analytics.ga4;
  if (!config.measurementId) {
    console.warn('GA4 measurementId not set, skipping load');
    return;
  }
  
  const measurementId = config.measurementId;
  
  // Check if already loaded
  if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`)) {
    console.log('GA4 already loaded');
    return;
  }
  
  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);
  
  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
  
  console.log('GA4 script loaded');
}

/**
 * Load analytics based on provider and consent
 */
function loadAnalytics() {
  const consent = getConsent();
  if (consent !== 'granted') {
    console.log('Analytics not loaded: consent not granted');
    return;
  }
  
  const provider = window.APP_CONFIG.analytics.provider;
  
  if (provider === 'plausible') {
    loadPlausible();
  } else if (provider === 'ga4') {
    loadGA4();
  } else if (provider === 'none') {
    console.log('Analytics provider set to none');
  } else {
    console.warn('Unknown analytics provider:', provider);
  }
}

/**
 * Track an event
 * @param {string} eventName - Name of the event to track
 * @param {Object} [eventData] - Optional event data/properties
 */
function track(eventName, eventData = {}) {
  // Check consent
  const consent = getConsent();
  if (consent !== 'granted') {
    console.log('Event not tracked (no consent):', eventName);
    return;
  }
  
  const provider = window.APP_CONFIG.analytics.provider;
  
  if (provider === 'plausible') {
    // Track with Plausible
    if (window.plausible) {
      try {
        window.plausible(eventName, { props: eventData });
        console.log('Plausible event tracked:', eventName, eventData);
      } catch (error) {
        console.error('Error tracking Plausible event:', error);
      }
    } else {
      console.log('Plausible not loaded yet, event not tracked:', eventName);
    }
  } else if (provider === 'ga4') {
    // Track with GA4
    if (window.gtag) {
      try {
        window.gtag('event', eventName, eventData);
        console.log('GA4 event tracked:', eventName, eventData);
      } catch (error) {
        console.error('Error tracking GA4 event:', error);
      }
    } else {
      console.log('GA4 not loaded yet, event not tracked:', eventName);
    }
  } else if (provider === 'none') {
    console.log('Analytics disabled, event not tracked:', eventName);
  } else {
    console.log('Unknown provider, event not tracked:', eventName);
  }
}

/**
 * Initialize consent banner handlers
 */
function initConsentBanner() {
  const banner = document.getElementById('consentBanner');
  const acceptBtn = document.getElementById('consentAccept');
  const rejectBtn = document.getElementById('consentReject');
  
  if (!banner || !acceptBtn || !rejectBtn) {
    console.warn('Consent banner elements not found');
    return;
  }
  
  acceptBtn.addEventListener('click', () => {
    setConsent('granted');
    updateConsentBanner();
    loadAnalytics();
    // Load ads after consent is granted
    initAdSlots();
  });
  
  rejectBtn.addEventListener('click', () => {
    setConsent('denied');
    updateConsentBanner();
  });
  
  // Initial banner state
  updateConsentBanner();
}

/**
 * Initialize ad slots based on configuration
 */
function initAdSlots() {
  const adsConfig = window.APP_CONFIG.ads;
  
  if (!adsConfig) {
    console.warn('Ads configuration not found');
    return;
  }
  
  // Get all ad slot elements
  const adSlots = {
    top: document.getElementById('adTop'),
    sidebar: document.getElementById('adSidebar'),
    bottom: document.getElementById('adBottom')
  };
  
  // If ads are disabled, hide all slots
  if (!adsConfig.enabled) {
    Object.values(adSlots).forEach(slot => {
      if (slot) {
        slot.classList.add('is-hidden');
      }
    });
    console.log('Ads disabled - all slots hidden');
    return;
  }
  
  // Check consent if required
  const consentRequired = window.APP_CONFIG.consentRequired;
  const consent = getConsent();
  
  if (consentRequired && consent !== 'granted') {
    // Hide ads until consent is granted
    Object.values(adSlots).forEach(slot => {
      if (slot) {
        slot.classList.add('is-hidden');
      }
    });
    console.log('Ads hidden - waiting for consent');
    return;
  }
  
  // Ads are enabled and consent is granted (or not required) - handle based on provider
  const provider = adsConfig.provider;
  
  if (provider === 'static') {
    renderStaticAds(adSlots, adsConfig.static);
  } else if (provider === 'adsense') {
    loadAdSense();
  } else if (provider === 'none') {
    // Hide all slots
    Object.values(adSlots).forEach(slot => {
      if (slot) {
        slot.classList.add('is-hidden');
      }
    });
    console.log('Ad provider set to none - all slots hidden');
  } else {
    console.warn('Unknown ad provider:', provider);
  }
}

/**
 * Validate URL format for security
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid and safe URL
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    const urlObj = new URL(url);
    // Explicitly only allow http and https protocols
    // Reject potentially dangerous protocols like javascript:, data:, file:, etc.
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

/**
 * Render static ads into ad slots
 * @param {Object} adSlots - Object containing ad slot elements
 * @param {Object} staticConfig - Static ads configuration
 */
function renderStaticAds(adSlots, staticConfig) {
  if (!staticConfig || !staticConfig.slots) {
    console.warn('Static ads configuration not found');
    return;
  }
  
  // Render each slot
  Object.entries(adSlots).forEach(([slotName, slotElement]) => {
    if (!slotElement) {
      return;
    }
    
    const slotConfig = staticConfig.slots[slotName];
    
    if (!slotConfig || !slotConfig.enabled) {
      // Hide slot if not configured or not enabled
      slotElement.classList.add('is-hidden');
      return;
    }
    
    // Validate URLs before using them
    if (!isValidUrl(slotConfig.link)) {
      console.error(`Invalid link URL in ad slot config: ${slotName} - ${slotConfig.link}`);
      slotElement.classList.add('is-hidden');
      return;
    }
    if (!isValidUrl(slotConfig.image)) {
      console.error(`Invalid image URL in ad slot config: ${slotName} - ${slotConfig.image}`);
      slotElement.classList.add('is-hidden');
      return;
    }
    
    // Create ad link and image
    const link = document.createElement('a');
    link.href = slotConfig.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    const img = document.createElement('img');
    img.src = slotConfig.image;
    img.alt = 'Advertisement';
    
    link.appendChild(img);
    
    // Clear existing content and add the ad
    slotElement.innerHTML = '';
    slotElement.appendChild(link);
    
    console.log(`Static ad rendered in slot: ${slotName}`);
  });
}

/**
 * Load AdSense ads (stub for future implementation)
 * This function prepares the page for AdSense but doesn't activate it yet
 */
function loadAdSense() {
  console.log('loadAdSense() called - stub for future AdSense integration');
  
  const adsenseConfig = window.APP_CONFIG.ads?.adsense;
  
  if (!adsenseConfig || !adsenseConfig.client) {
    console.warn('AdSense configuration incomplete');
    return;
  }
  
  // Future implementation would:
  // 1. Load AdSense script: <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX"></script>
  // 2. Insert ins elements with data-ad-client and data-ad-slot attributes
  // 3. Call (adsbygoogle = window.adsbygoogle || []).push({});
  
  console.log('AdSense client ID:', adsenseConfig.client);
  console.log('AdSense slots:', adsenseConfig.slots);
  
  // For now, just log that AdSense would be loaded here
  console.log('AdSense integration is prepared but not activated');
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log('ready');
  console.log('APP_CONFIG:', window.APP_CONFIG);
  
  // Initialize ad slots first
  initAdSlots();
  
  // Initialize consent banner
  initConsentBanner();
  
  // Load analytics if consent already granted
  if (getConsent() === 'granted') {
    loadAnalytics();
  }
  
  try {
    // Load and validate holiday data
    const holidayData = await loadHolidayData();
    validateHolidayData(holidayData);
    
    // Log summary
    const yearKeys = Object.keys(holidayData.years);
    const totalYears = yearKeys.length;
    
    console.log('=== Holiday Data Summary ===');
    console.log(`Total years loaded: ${totalYears}`);
    console.log(`Year range: ${holidayData.meta.years[0]} - ${holidayData.meta.years[1]}`);
    
    // Log holidays count for each year
    yearKeys.forEach(year => {
      const holidayCount = holidayData.years[year].length;
      console.log(`Year ${year}: ${holidayCount} holidays`);
    });
    
    // Store for later use
    window.holidayData = holidayData;
    
    // Load state from localStorage
    const savedState = loadState();
    
    // Populate year select with years from JSON
    populateYearSelect(holidayData);
    
    // Restore satMode if available (before initializing handlers)
    if (savedState && savedState.satMode) {
      const toggle = document.getElementById('satModeToggle');
      if (toggle) {
        toggle.checked = (savedState.satMode === window.SAT_MODE.COMPENSATED);
      }
    }
    
    // Initialize year navigation
    initYearNavigation();
    
    // Initialize satMode handlers
    initSatModeHandlers();
    
    // Get current year: URL parameter takes precedence, then saved state, then default
    let currentYear;
    const urlYear = getCurrentYear(holidayData);
    const urlParams = new URLSearchParams(window.location.search);
    const hasUrlParam = urlParams.has('rok');
    
    if (hasUrlParam) {
      // URL parameter takes precedence
      currentYear = urlYear;
    } else if (savedState && savedState.year && holidayData.years[savedState.year.toString()]) {
      // Then use saved state
      currentYear = savedState.year;
    } else {
      // Fallback to default
      currentYear = urlYear;
    }
    
    // Set initial year and render holiday list without triggering save
    const yearSelect = document.getElementById('yearSelect');
    yearSelect.value = currentYear;
    updateURLParameter(currentYear);
    const satMode = getCurrentSatMode();
    
    updateYearDisplay(currentYear, satMode);
    
  } catch (error) {
    console.error('Failed to load or validate holiday data:', error);
  }
});
