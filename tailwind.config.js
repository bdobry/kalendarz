export default {
  content: ["./index.html", "./*.tsx", "./components/**/*.tsx", "./utils/**/*.ts"],
  theme: {
          extend: {
            fontFamily: {
              sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
            },
            colors: {
              brand: {
                50: '#F5F5FF',
                100: '#EBEBFF',
                200: '#D6D6FF',
                300: '#BDBEFF',
                400: '#9E9EFF',
                500: '#7C7CFF', // Main Brand
                600: '#5C5CFF',
                700: '#4242E6',
                800: '#3333B8',
                900: '#29298F',
                950: '#1A1A5E',
              },
              neutral: {
                50: '#FAFAFA',
                100: '#F4F4F5',
                200: '#E4E4E7',
                300: '#D4D4D8',
                400: '#A1A1AA',
                500: '#71717A',
                600: '#52525B',
                700: '#3F3F46',
                800: '#27272A',
                900: '#18181B',
                950: '#09090B',
              },
              primary: '#5C5CFF', // Mapping primary to brand-600 for backward compat
              canvas: {
                default: '#FFFFFF',
                subtle: '#FAFAFA',
                hover: '#F4F4F5',
              }
            },
            boxShadow: {
              'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
              'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
              'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
              'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              'inner-border': 'inset 0 0 0 1px rgba(0,0,0,0.08)',
            },
            borderRadius: {
              'sm': '0.25rem',
              'md': '0.375rem',
              'lg': '0.5rem',
              'xl': '0.75rem',
              '2xl': '1rem',
              '3xl': '1.5rem',
              'squarcle': '0.6rem', // Custom squarcle-ish
            }
          },
        },
};
