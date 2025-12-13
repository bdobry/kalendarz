// Default application configuration
window.APP_CONFIG = {
  defaultYear: new Date().getFullYear(),
  defaultSaturdayMode: 'NOT_COMPENSATED', // 'COMPENSATED' or 'NOT_COMPENSATED'
  defaultGrade: 'A',
  locale: 'pl-PL',
  consentRequired: true,
  ads: {
    enabled: true,
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
