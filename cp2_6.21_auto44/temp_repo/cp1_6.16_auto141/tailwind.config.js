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
        bg: '#1A1A2E',
        'bg-deep': '#0F0F1E',
        'bg-card': '#252542',
        gold: '#D4AF37',
        'gold-light': '#E8CC6E',
        'gold-dark': '#B8941F',
        crimson: '#8B0000',
        'crimson-light': '#A52A2A',
        'key-white': '#FFF8E7',
        'key-black': '#1A1A1A',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Source Sans 3', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 0.6s ease-in-out',
        'flash-green': 'flash-green 0.6s ease-in-out',
        'flash-red': 'flash-red 0.8s ease-in-out',
        'key-bounce': 'key-bounce 0.15s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.8)' },
        },
        'flash-green': {
          '0%': { backgroundColor: 'rgba(34, 197, 94, 0.7)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'flash-red': {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.7)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'key-bounce': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
