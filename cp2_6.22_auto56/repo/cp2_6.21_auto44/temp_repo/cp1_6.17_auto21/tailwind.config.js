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
        primary: '#1976D2',
        'primary-dark': '#1565C0',
        'primary-light': '#42A5F5',
        neutral: '#616161',
        'border-gray': '#E0E0E0',
        'panel-bg': '#F9F9F9',
        'checker': '#EBEBEB',
      },
      keyframes: {
        'btn-click': {
          '0%': { transform: 'scale(1.0)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1.0)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-out': {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-8px)' },
        },
      },
      animation: {
        'btn-click': 'btn-click 0.1s ease-in-out',
        'spin-slow': 'spin-slow 1s linear infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
};
