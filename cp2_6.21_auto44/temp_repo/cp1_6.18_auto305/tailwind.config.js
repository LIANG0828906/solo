/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'cream': '#FFF8E7',
        'text-primary': '#2D3436',
        'text-secondary': '#636E72',
        'mood-happy': '#FF6B6B',
        'mood-touched': '#4ECDC4',
        'mood-surprised': '#FFD93D',
        'mood-warm': '#6BCB77',
        'mood-funny': '#A29BFE',
        'theme-orange': '#E17055',
        'theme-green': '#00B894',
        'theme-blue': '#0984E3',
        'theme-pink': '#E84393',
        'theme-orange-bg1': '#FFF3E0',
        'theme-orange-bg2': '#FFE0B2',
        'theme-orange-bg3': '#FFCC80',
        'theme-green-bg1': '#E8F5E9',
        'theme-green-bg2': '#C8E6C9',
        'theme-green-bg3': '#A5D6A7',
        'theme-blue-bg1': '#E3F2FD',
        'theme-blue-bg2': '#BBDEFB',
        'theme-blue-bg3': '#90CAF9',
        'theme-pink-bg1': '#FCE4EC',
        'theme-pink-bg2': '#F8BBD0',
        'theme-pink-bg3': '#F48FB1',
        'heart-gray': '#CCCCCC',
        'heart-red': '#E74C3C',
      },
      boxShadow: {
        'card': '0 4px 16px rgba(0,0,0,0.08)',
        'modal': '0 8px 32px rgba(0,0,0,0.2)',
      },
      borderRadius: {
        'card': '12px',
        'modal': '16px',
      },
      animation: {
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pop-in': 'popIn 0.3s ease-out forwards',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-10deg)' },
          '75%': { transform: 'rotate(10deg)' },
        },
      },
    },
  },
  plugins: [],
};
