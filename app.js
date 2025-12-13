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
 * Render calendar for the entire year
 * @param {number} year - Year to render
 * @param {Set} holidaysSet - Set of holiday date strings (YYYY-MM-DD)
 */
function renderCalendar(year, holidaysSet) {
  const calendarContainer = document.getElementById('calendar');
  
  // Clear existing content
  calendarContainer.innerHTML = '';
  
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
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
      
      // Mark labeled days
      if (window.labeledDays && window.labels && window.labeledDays[dateString]) {
        const labelId = window.labeledDays[dateString];
        const label = window.labels.find(l => l.id === labelId);
        if (label) {
          dayButton.classList.add('labeled');
          dayButton.style.backgroundColor = label.color;
          dayButton.style.color = 'white';
          dayButton.style.fontWeight = 'bold';
        }
      }
      
      // Add click handler for labeling
      dayButton.addEventListener('click', (e) => {
        handleDayClick(dateString, e);
      });
      
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
    
    // Render calendar with holidays
    const holidaysSet = new Set(holidays.map(h => h.date));
    renderCalendar(year, holidaysSet);
    
    // Calculate and render leave statistics
    const leaveStats = calculateLeaveStats(year, holidaysSet);
    renderLeaveStats(leaveStats);
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
      
      // Save state after satMode change
      saveState();
      
      // Track event
      track('sat_mode_change', { mode: satMode });
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
    const activeLabel = getActiveLabel();
    
    const state = {
      year: currentYear,
      satMode: satMode,
      selectedLabelId: activeLabel ? activeLabel.id : null,
      dayAssignments: window.labeledDays || {}
    };
    
    localStorage.setItem('kalendarz-pl:v1', JSON.stringify(state));
    console.log('State saved to localStorage:', state);
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
}

/**
 * Initialize labels system with default labels
 */
function initLabels() {
  // Default labels
  window.labels = [
    { id: 'leave_old', name: 'Urlop zaległy', color: '#ff9800', active: false },
    { id: 'leave_new', name: 'Urlop bieżący', color: '#4caf50', active: false },
    { id: 'plan', name: 'Plan', color: '#2196f3', active: false }
  ];
  
  // Store labeled days: { 'YYYY-MM-DD': 'label_id' }
  window.labeledDays = {};
  
  renderLabels();
}

/**
 * Render labels list with chips
 */
function renderLabels() {
  const labelsList = document.getElementById('labelsList');
  labelsList.innerHTML = '';
  
  window.labels.forEach(label => {
    const labelItem = document.createElement('div');
    labelItem.className = 'label-item';
    labelItem.setAttribute('data-label-id', label.id);
    if (label.active) {
      labelItem.classList.add('active');
    }
    labelItem.style.borderLeft = `4px solid ${label.color}`;
    
    const labelChip = document.createElement('span');
    labelChip.className = 'label-chip';
    labelChip.style.backgroundColor = label.color;
    labelChip.textContent = label.name;
    
    labelItem.appendChild(labelChip);
    
    // Click to activate label
    labelItem.addEventListener('click', () => {
      // Deactivate all other labels
      window.labels.forEach(l => l.active = false);
      // Activate this label
      label.active = true;
      // Update DOM efficiently - just toggle classes
      document.querySelectorAll('.label-item').forEach(item => {
        item.classList.remove('active');
      });
      labelItem.classList.add('active');
      
      // Save state after label selection change
      saveState();
    });
    
    labelsList.appendChild(labelItem);
  });
}

/**
 * Get currently active label
 * @returns {Object|null} Active label or null
 */
function getActiveLabel() {
  return window.labels.find(l => l.active) || null;
}

/**
 * Handle day click in calendar
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {Event} event - Click event
 */
function handleDayClick(dateString, event) {
  const activeLabel = getActiveLabel();
  const wasLabeled = window.labeledDays[dateString] !== undefined;
  
  // Alt+click or click on already labeled day with same label: remove label
  if (event.altKey || (activeLabel && window.labeledDays[dateString] === activeLabel.id)) {
    delete window.labeledDays[dateString];
    // Track unmark event
    track('day_unmark', { date: dateString, label: activeLabel?.id });
  } else if (activeLabel) {
    // Assign active label to this day
    window.labeledDays[dateString] = activeLabel.id;
    // Track mark event only if it wasn't already labeled
    if (!wasLabeled) {
      track('day_mark', { date: dateString, label: activeLabel.id });
    }
  }
  
  // Re-render calendar and update leave counters
  const yearSelect = document.getElementById('yearSelect');
  const currentYear = parseInt(yearSelect.value, 10);
  const satMode = getCurrentSatMode();
  updateYearDisplay(currentYear, satMode);
  
  // Save state after day assignment change
  saveState();
}

/**
 * Calculate leave days for labeled days
 * @param {number} year - Current year
 * @param {Set} holidaysSet - Set of holiday dates
 * @returns {Object} Leave statistics
 */
function calculateLeaveStats(year, holidaysSet) {
  const stats = {
    leaveTotal: 0,
    leaveOld: 0,
    leaveNew: 0
  };
  
  if (!window.labeledDays) {
    return stats;
  }
  
  Object.entries(window.labeledDays).forEach(([dateString, labelId]) => {
    // Parse date with validation
    const parts = dateString.split('-');
    if (parts.length !== 3) {
      console.warn(`Invalid date format: ${dateString}`);
      return;
    }
    
    const [yearPart, monthPart, dayPart] = parts.map(Number);
    
    // Validate parsed values
    if (isNaN(yearPart) || isNaN(monthPart) || isNaN(dayPart)) {
      console.warn(`Invalid date values: ${dateString}`);
      return;
    }
    
    // Only count if date is in current year
    if (yearPart !== year) {
      return;
    }
    
    const date = new Date(yearPart, monthPart - 1, dayPart);
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
    
    // Only count Mon-Fri (1-5) and not holidays
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && !holidaysSet.has(dateString)) {
      if (labelId === 'leave_old') {
        stats.leaveOld++;
      } else if (labelId === 'leave_new') {
        stats.leaveNew++;
      }
    }
  });
  
  stats.leaveTotal = stats.leaveOld + stats.leaveNew;
  return stats;
}

/**
 * Render leave statistics
 * @param {Object} leaveStats - Leave statistics object
 */
function renderLeaveStats(leaveStats) {
  const leaveTotalEl = document.getElementById('leaveTotal');
  const leaveOldEl = document.getElementById('leaveOld');
  const leaveNewEl = document.getElementById('leaveNew');
  
  if (leaveTotalEl) {
    leaveTotalEl.textContent = `Łącznie: ${leaveStats.leaveTotal} dni`;
  }
  if (leaveOldEl) {
    leaveOldEl.textContent = `Z poprzedniego roku: ${leaveStats.leaveOld} dni`;
  }
  if (leaveNewEl) {
    leaveNewEl.textContent = `Z bieżącego roku: ${leaveStats.leaveNew} dni`;
  }
}

/**
 * Initialize clear all button handler
 */
function initClearAllButton() {
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      // Clear all day assignments
      window.labeledDays = {};
      
      // Re-render calendar and update counters
      const yearSelect = document.getElementById('yearSelect');
      const currentYear = parseInt(yearSelect.value, 10);
      const satMode = getCurrentSatMode();
      updateYearDisplay(currentYear, satMode);
      
      // Save state after clearing
      saveState();
      
      // Track event
      track('clear_all');
      
      console.log('All day assignments cleared');
    });
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
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
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
    if (!isValidUrl(slotConfig.link) || !isValidUrl(slotConfig.image)) {
      console.error(`Invalid URL in ad slot config: ${slotName}`);
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
    
    // Initialize labels system
    initLabels();
    
    // Load state from localStorage
    const savedState = loadState();
    
    // Restore day assignments if available
    if (savedState && savedState.dayAssignments) {
      window.labeledDays = savedState.dayAssignments;
    }
    
    // Populate year select with years from JSON
    populateYearSelect(holidayData);
    
    // Restore satMode if available (before initializing handlers)
    if (savedState && savedState.satMode) {
      const radios = document.getElementsByName('satMode');
      for (const radio of radios) {
        if (radio.value === savedState.satMode) {
          radio.checked = true;
          break;
        }
      }
    }
    
    // Initialize year navigation
    initYearNavigation();
    
    // Initialize satMode handlers
    initSatModeHandlers();
    
    // Restore selected label if available
    if (savedState && savedState.selectedLabelId) {
      const label = window.labels.find(l => l.id === savedState.selectedLabelId);
      if (label) {
        label.active = true;
        renderLabels();
      }
    }
    
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
    
    // Initialize clear all button
    initClearAllButton();
    
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
