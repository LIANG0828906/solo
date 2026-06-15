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
        warm: {
          orange: '#F28C28',
          cream: '#FFF8E7',
          olive: '#6B8E23',
          dark: '#333333',
          'orange-light': '#FFF0D4',
          'orange-dark': '#D97A1E',
          'cream-dark': '#F5EDD4',
        },
      },
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        'card': '8px',
      },
      transitionDuration: {
        '200': '200ms',
      },
      keyframes: {
        'check-spin': {
          '0%': { transform: 'rotate(0deg) scale(0.5)', opacity: '0' },
          '50%': { transform: 'rotate(200deg) scale(1.2)', opacity: '1' },
          '100%': { transform: 'rotate(360deg) scale(1)', opacity: '1' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fly-in': {
          '0%': { transform: 'translateY(60px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'flash-green': {
          '0%': { boxShadow: '0 0 0 0 rgba(107, 142, 35, 0.6)' },
          '50%': { boxShadow: '0 0 20px 10px rgba(107, 142, 35, 0.3)' },
          '100%': { boxShadow: '0 0 0 0 rgba(107, 142, 35, 0)' },
        },
        'pulse-ring': {
          '0%': { strokeDashoffset: '283' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'check-spin': 'check-spin 0.4s ease-out forwards',
        'bounce-in': 'bounce-in 0.3s ease-out forwards',
        'fly-in': 'fly-in 0.4s ease-out forwards',
        'flash-green': 'flash-green 0.8s ease-out',
      },
    },
  },
  plugins: [],
};
