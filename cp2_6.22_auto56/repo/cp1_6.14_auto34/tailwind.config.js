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
        sand: {
          50: '#FAF7F2',
          100: '#F5F0E8',
          200: '#E8DCC4',
          300: '#D4C7AC',
        },
        olive: {
          50: '#F0F3EE',
          100: '#DDE5D8',
          200: '#A5B49B',
          300: '#6B7F5E',
          400: '#5a6b4e',
          500: '#4a5a3e',
        },
        brown: {
          50: '#F5F0E8',
          100: '#E8DCC4',
          200: '#A08060',
          300: '#8B7355',
          400: '#5D4A3A',
          500: '#4A3728',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        'node': '0 4px 12px rgba(74, 55, 40, 0.15)',
        'card': '0 8px 32px rgba(74, 55, 40, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
