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
    
  } catch (error) {
    console.error('Failed to load or validate holiday data:', error);
  }
});
