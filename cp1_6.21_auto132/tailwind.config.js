/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: '8px',
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#6366F1',
          50: '#EEF2FF',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
        },
        secondary: {
          DEFAULT: '#10B981',
          500: '#10B981',
          600: '#059669',
        },
        error: {
          DEFAULT: '#F43F5E',
          500: '#F43F5E',
          600: '#E11D48',
        },
      },
    },
  },
  plugins: [],
};
