/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
      },
    },
    extend: {
      colors: {
        cream: {
          50: '#FFFBF5',
          100: '#FFF9F2',
          200: '#FFEFE0',
          300: '#FFE0C4',
        },
        warm: {
          50: '#FFF3E8',
          100: '#FFE2CC',
          200: '#FFB988',
          300: '#FFA265',
          400: '#FF8C42',
          500: '#F57529',
          600: '#E06018',
          700: '#B84A0E',
        },
        cocoa: {
          50: '#F7F2EE',
          100: '#E8DDD3',
          200: '#A68B74',
          300: '#7D5F48',
          400: '#5D4037',
          500: '#3E2A22',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 12px rgba(255, 140, 66, 0.12)',
        'card-hover': '0 8px 28px rgba(255, 140, 66, 0.22)',
        'glow-warm': '0 0 0 3px rgba(255, 140, 66, 0.2)',
        'soft': '0 4px 20px rgba(93, 64, 55, 0.08)',
      },
      borderRadius: {
        'card': '16px',
        'xl': '12px',
      },
      animation: {
        'float-up': 'floatUp 200ms ease-out forwards',
        'fade-in-up': 'fadeInUp 300ms ease forwards',
        'progress-fill': 'progressFill 400ms cubic-bezier(0.22, 1.2, 0.36, 1) forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        floatUp: {
          '0%': { transform: 'translateY(0)', boxShadow: '0 2px 12px rgba(255, 140, 66, 0.12)' },
          '100%': { transform: 'translateY(-6px)', boxShadow: '0 8px 28px rgba(255, 140, 66, 0.22)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        progressFill: {
          '0%': { width: '0%' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
