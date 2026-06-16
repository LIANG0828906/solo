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
        parchment: '#F5E6C8',
        'parchment-dark': '#E8D5B0',
        'parchment-light': '#FBF3E4',
        bark: '#4A3B32',
        'bark-light': '#6B5B50',
        'bark-muted': '#8A7968',
        ink: '#3A6B47',
        'ink-light': '#4E8A5E',
        'ink-dark': '#2D5437',
        gold: '#C8A84E',
        'gold-light': '#E0C878',
        'gold-dark': '#A68A30',
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['"Segoe UI"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'trophy-swing': {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '50%': { transform: 'rotate(8deg)' },
        },
        'star-fill': {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '50%': { transform: 'rotate(180deg) scale(1.3)' },
          '100%': { transform: 'rotate(360deg) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'trophy-swing': 'trophy-swing 1.5s ease-in-out infinite',
        'star-fill': 'star-fill 0.2s ease',
        'fade-in': 'fade-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
