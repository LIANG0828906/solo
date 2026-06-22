/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bronze: {
          50: '#fdf8f3',
          100: '#f9ead9',
          200: '#f2d2b3',
          300: '#e9b483',
          400: '#de8e50',
          500: '#b87333',
          600: '#a6642a',
          700: '#8a5124',
          800: '#704223',
          900: '#5c381f',
        },
        jade: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#00c853',
          600: '#00a844',
          700: '#008836',
          800: '#006828',
          900: '#00481a',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(184, 115, 51, 0.5)',
        'glow-jade': '0 0 20px rgba(0, 200, 83, 0.5)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'ripple': 'ripple 1s ease-out forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(184, 115, 51, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(184, 115, 51, 0.6)' },
        },
        'ripple': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
