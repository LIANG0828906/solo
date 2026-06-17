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
          DEFAULT: '#7E57C2',
          hover: '#5E35B1',
        },
        accent: {
          green: '#26A69A',
          greenBg: '#E0F2F1',
          purple: '#7E57C2',
          blue: '#42A5F5',
          gold: '#FFA726',
        },
        bg: {
          dark1: '#1A0B2E',
          dark2: '#2D1B4E',
        },
        glass: {
          bg: 'rgba(255,255,255,0.08)',
          border: 'rgba(255,255,255,0.2)',
        },
        timeline: {
          line: '#BDBDBD',
        },
        tree: {
          active: '#7E57C2',
          inactive: '#BDBDBD',
        },
      },
      fontFamily: {
        display: ['Crimson Pro', 'serif'],
        body: ['Noto Sans SC', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-scale': 'fadeScale 0.5s ease-out',
        'btn-press': 'btnPress 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeScale: {
          '0%': { opacity: '0', transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        btnPress: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
