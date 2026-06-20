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
        wood: {
          DEFAULT: '#3E2723',
          light: '#5D4037',
        },
        warm: {
          DEFAULT: '#F5E6C8',
          dark: '#C4A882',
        },
        gold: {
          DEFAULT: '#FFD700',
          dark: '#FFA000',
        },
        navy: {
          DEFAULT: '#1A237E',
          light: '#283593',
          hover: '#3949AB',
        },
        parchment: '#F9F6F0',
        brick: '#8B4513',
        correct: '#4CAF50',
        incorrect: '#F44336',
        muted: '#B0BEC5',
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'SimSun', 'serif'],
        sans: ['Noto Sans SC', 'Microsoft YaHei', 'sans-serif'],
      },
      keyframes: {
        'fade-slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-60px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-slide-out': {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(60px)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-3px)' },
          '75%': { transform: 'translateX(3px)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-slide-in': 'fade-slide-in 400ms ease-in-out forwards',
        'fade-slide-out': 'fade-slide-out 400ms ease-in-out forwards',
        'spin-slow': 'spin-slow 2s linear infinite',
        'shake': 'shake 200ms ease-in-out',
        'pop-in': 'pop-in 200ms ease-out forwards',
      },
    },
  },
  plugins: [],
};
