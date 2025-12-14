// Default application configuration
window.APP_CONFIG = {
  defaultYear: new Date().getFullYear(),
  defaultSaturdayMode: 'NOT_COMPENSATED', // 'COMPENSATED' or 'NOT_COMPENSATED'
  defaultGrade: 'A',
  locale: 'pl-PL',
  consentRequired: true,
  ads: {
    enabled: false,
    provider: 'static', // 'static', 'adsense', or 'none'
    static: {
      slots: {
        top: {
          enabled: true,
          link: 'https://example.com',
          image: 'https://via.placeholder.com/728x90?text=Ad+Top'
        },
        sidebar: {
          enabled: true,
          link: 'https://example.com',
          image: 'https://via.placeholder.com/300x250?text=Ad+Sidebar'
        },
        bottom: {
          enabled: true,
          link: 'https://example.com',
          image: 'https://via.placeholder.com/728x90?text=Ad+Bottom'
        }
      }
    },
    adsense: {
      client: '', // e.g., 'ca-pub-XXXXXXXXXXXXXXXX'
      slots: {
        top: '',
        sidebar: '',
        bottom: ''
      }
    }
  },
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

// Energy label grade colors (A = best/green, I = worst/red)
window.GRADE_COLORS = {
  'A': { bg: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', text: 'white' },
  'B': { bg: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)', text: 'white' },
  'C': { bg: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)', text: 'white' },
  'D': { bg: 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)', text: 'white' },
  'E': { bg: 'linear-gradient(135deg, #cddc39 0%, #ffeb3b 100%)', text: '#333' },
  'F': { bg: 'linear-gradient(135deg, #ffeb3b 0%, #ffc107 100%)', text: '#333' },
  'G': { bg: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)', text: 'white' },
  'H': { bg: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)', text: 'white' },
  'I': { bg: 'linear-gradient(135deg, #ff5722 0%, #d32f2f 100%)', text: 'white' }
};
