/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        oak: {
          50: '#FFF8DC',
          100: '#F5E6D3',
          200: '#E8D0B3',
          300: '#D2B48C',
          400: '#C49B6E',
          500: '#8B5E3C',
          600: '#7A4F2E',
          700: '#6B4226',
          800: '#5C3620',
          900: '#4A2A18',
        },
        wheat: '#D2B48C',
        cornsilk: '#FFF8DC',
        drift: {
          drifting: '#4CAF50',
          arrived: '#2196F3',
          pending: '#FF9800',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.1)',
        'card-hover': '0 8px 24px rgba(0,0,0,0.15)',
      },
      transitionTimingFunction: {
        'card': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
