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
 * Render holiday list for selected year
 * @param {number} year - Selected year
 */
function renderHolidayList(year) {
  const holidayList = document.getElementById('holidayList');
  const holidays = window.holidayData.years[year.toString()];
  
  if (!holidays) {
    holidayList.innerHTML = '<h3>Święta</h3><p>Brak danych dla tego roku.</p>';
    return;
  }
  
  // Clear existing content
  holidayList.innerHTML = '<h3>Święta</h3>';
  
  holidays.forEach(holiday => {
    // Parse date safely - YYYY-MM-DD format
    const [yearPart, monthPart, dayPart] = holiday.date.split('-').map(Number);
    const date = new Date(yearPart, monthPart - 1, dayPart);
    const dayName = getPolishDayName(date);
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
    
    const nameDiv = document.createElement('div');
    nameDiv.textContent = holiday.name;
    
    itemDiv.appendChild(dateDiv);
    itemDiv.appendChild(nameDiv);
    holidayList.appendChild(itemDiv);
  });
}

/**
 * Set current year and update UI
 * @param {number} year - Year to set
 */
function setCurrentYear(year) {
  const yearSelect = document.getElementById('yearSelect');
  yearSelect.value = year;
  updateURLParameter(year);
  renderHolidayList(year);
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
    
    // Set initial year and render holiday list
    setCurrentYear(currentYear);
    
  } catch (error) {
    console.error('Failed to load or validate holiday data:', error);
  }
});
