// Default application configuration
window.APP_CONFIG = {
  defaultYear: new Date().getFullYear(),
  defaultSaturdayMode: 'NOT_COMPENSATED', // 'COMPENSATED' or 'NOT_COMPENSATED'
  defaultGrade: 'A',
  locale: 'pl-PL',
  adsEnabled: true,
  consentRequired: true,
  analytics: {
    provider: 'none', // 'none', 'plausible', or 'ga4'
    plausible: {
      domain: '', // e.g., 'example.com'
      src: 'https://plausible.io/js/script.js' // or custom domain
    },
    ga4: {
      measurementId: '' // e.g., 'G-XXXXXXXXXX'
    }
  },
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    holiday: '#e74c3c',
    saturday: '#3498db',
    sunday: '#e67e22',
    bridge: '#f39c12'
  }
};

// Saturday mode constants
window.SAT_MODE = {
  COMPENSATED: 'COMPENSATED',
  NOT_COMPENSATED: 'NOT_COMPENSATED'
};
