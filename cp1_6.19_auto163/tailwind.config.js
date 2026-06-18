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
        'bg-primary': '#1A237E',
        'accent-gold': '#FFD54F',
        'card-bg': '#263238',
        'event-bg': '#2E2E2E',
        'bubble-blue': '#3D5AFE',
        'conflict-red': '#E53935',
        'success-green': '#4CAF50',
        'muted-gray': '#B0BEC5',
      },
      fontFamily: {
        'serif-sc': ['"Noto Serif SC"', 'serif'],
        'sans-sc': ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'pulse-conflict': 'pulseConflict 0.4s ease-in-out infinite',
      },
      keyframes: {
        pulseConflict: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      transitionTimingFunction: {
        'card-ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
