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
          50: '#F9F6EF',
          100: '#F5F0E6',
          200: '#E8DFCD',
          300: '#D4C6A8',
          400: '#BFA782',
        },
        wood: {
          50: '#F5F0E6',
          100: '#E8DFD0',
          200: '#D4C4A8',
          300: '#BFA181',
          400: '#A68A64',
          500: '#8B7355',
          600: '#736049',
          700: '#5C4D3D',
        },
        eco: {
          50: '#F0F5F2',
          100: '#DBE6DF',
          200: '#B7CDC0',
          300: '#8BB39D',
          400: '#63967B',
          500: '#4A7C59',
          600: '#3B6447',
          700: '#2E4E37',
        },
        difficulty: {
          easy: '#4A7C59',
          medium: '#D97706',
          hard: '#DC2626',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(139, 115, 85, 0.1)',
        'card-hover': '0 8px 24px rgba(139, 115, 85, 0.2)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
