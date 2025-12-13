// Main application script

/**
 * Load holiday data from JSON file
 * @returns {Promise<Object>} Holiday data object
 */
async function loadHolidayData() {
  try {
    const response = await fetch('data/holidays-pl-2025-2034.json');
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
 * Get current year from URL parameter or default to first year in JSON
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
  
  // Fallback to first year in JSON
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
    bridges: 0,
    effectiveDaysOff: 0,
    lost: 0
  };
  
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
      
      // Check if it's a bridge (Tuesday or Thursday)
      if (dayOfWeek === 2 || dayOfWeek === 4) {
        stats.bridges++;
      }
    }
  });
  
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
  const gradeIndex = Math.floor(((score - minScore) / range) * 8.999); // 8.999 to ensure we get 0-8
  
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
 * Render grade letter and scale to the UI
 * @param {Object} gradeInfo - Object with grade, score, minScore, maxScore
 */
function renderGrade(gradeInfo) {
  const { grade, score, minScore, maxScore } = gradeInfo;
  
  // Update grade letter display
  const gradeLetter = document.getElementById('gradeLetter');
  gradeLetter.textContent = grade;
  
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
    gradeBar.textContent = gradeLevel;
    gradeBar.title = `Klasa ${gradeLevel}`;
    gradeScale.appendChild(gradeBar);
  });
}

/**
 * Render statistics to the UI
 * @param {Object} stats - Statistics object from computeYearStats
 */
function renderStats(stats) {
  document.getElementById('statTotalHolidays').textContent = 
    `Wszystkie święta: ${stats.totalHolidays}`;
  document.getElementById('statWeekday').textContent = 
    `Dni powszednie: ${stats.weekday}`;
  document.getElementById('statSaturday').textContent = 
    `Soboty: ${stats.saturday}`;
  document.getElementById('statSunday').textContent = 
    `Niedziele: ${stats.sunday}`;
  document.getElementById('statBridges').textContent = 
    `Mostki: ${stats.bridges}`;
  document.getElementById('statEffectiveDaysOff').textContent = 
    `Efektywne dni wolne: ${stats.effectiveDaysOff}`;
  document.getElementById('statLost').textContent = 
    `Stracone święta: ${stats.lost}`;
}

/**
 * Render holiday list for selected year
 * @param {number} year - Selected year
 * @param {string} satMode - Saturday mode (COMPENSATED or NOT_COMPENSATED)
 */
function renderHolidayList(year, satMode) {
  const holidayList = document.getElementById('holidayList');
  const holidays = window.holidayData.years[year.toString()];
  
  // Clear existing content safely
  while (holidayList.firstChild) {
    holidayList.removeChild(holidayList.firstChild);
  }
  
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
 * Get current satMode from radio buttons
 * @returns {string} Current satMode (COMPENSATED or NOT_COMPENSATED)
 */
function getCurrentSatMode() {
  // Check if we have a cached reference
  if (!window._satModeRadios) {
    window._satModeRadios = document.getElementsByName('satMode');
  }
  
  const radios = window._satModeRadios;
  for (const radio of radios) {
    if (radio.checked) {
      return radio.value;
    }
  }
  return window.APP_CONFIG.defaultSaturdayMode;
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
    renderHolidayList(year, satMode);
    
    // Compute and render grade
    const gradeInfo = computeGrade(year, satMode, stats);
    renderGrade(gradeInfo);
  }
}

/**
 * Set current year and update UI
 * @param {number} year - Year to set
 */
function setCurrentYear(year) {
  const yearSelect = document.getElementById('yearSelect');
  yearSelect.value = year;
  updateURLParameter(year);
  const satMode = getCurrentSatMode();
  updateYearDisplay(year, satMode);
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
 * Initialize satMode radio button handlers
 */
function initSatModeHandlers() {
  const radios = document.getElementsByName('satMode');
  
  // Cache the radio buttons for later use
  window._satModeRadios = radios;
  
  radios.forEach(radio => {
    radio.addEventListener('change', function() {
      const yearSelect = document.getElementById('yearSelect');
      const currentYear = parseInt(yearSelect.value, 10);
      const satMode = getCurrentSatMode();
      updateYearDisplay(currentYear, satMode);
    });
  });
  
  // Set initial value from APP_CONFIG with validation
  const defaultMode = window.APP_CONFIG.defaultSaturdayMode;
  let foundMatch = false;
  for (const radio of radios) {
    if (radio.value === defaultMode) {
      radio.checked = true;
      foundMatch = true;
      break;
    }
  }
  
  // Fallback: if no match found, select the first radio button
  if (!foundMatch && radios.length > 0) {
    radios[0].checked = true;
    console.warn(`Default satMode "${defaultMode}" not found, using "${radios[0].value}" instead`);
  }
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log('ready');
  console.log('APP_CONFIG:', window.APP_CONFIG);
  
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
    
    // Populate year select with years from JSON
    populateYearSelect(holidayData);
    
    // Get current year from URL or default
    const currentYear = getCurrentYear(holidayData);
    
    // Initialize year navigation
    initYearNavigation();
    
    // Initialize satMode handlers
    initSatModeHandlers();
    
    // Set initial year and render holiday list
    setCurrentYear(currentYear);
    
  } catch (error) {
    console.error('Failed to load or validate holiday data:', error);
  }
});
