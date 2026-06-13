/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3182ce',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1a365d',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
        }
      },
      animation: {
        'bubble-pop': 'bubblePop 300ms ease-out forwards',
        'score-pop': 'scorePop 300ms ease-out forwards',
        'fade-in': 'fadeIn 300ms ease-out forwards',
      },
      keyframes: {
        bubblePop: {
          '0%': { opacity: '0', transform: 'scale(0.8) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        scorePop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};
